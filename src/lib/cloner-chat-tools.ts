// Chat-tool registry for the /admin/cloner chat-native page. Same
// Anthropic tool_use shape used by sales-chat-tools.ts. Each handler
// proxies to the site-xray pipeline (xray-pipeline.js for cloning,
// xfly.js for template swap) running on the Hetzner host. Set
// SITE_XRAY_API_URL + SITE_XRAY_API_KEY in env; missing env → clean
// "not configured" error so the chat says so instead of crashing.

import "server-only";

export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolInput {
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export const CLONER_TOOLS: ToolDef[] = [
  {
    name: "clone_site",
    description:
      "Kick off a full site clone via the site-xray pipeline. Crawls the source URL, captures every page + asset, and produces a deployable Next.js project. Returns a clone_id you can use to check status. Use when the user says 'clone X', 'rebuild this site for me', 'mirror Y'.",
    input_schema: {
      type: "object",
      properties: {
        source_url: {
          type: "string",
          description:
            "Origin URL to clone (e.g. https://example.com). Include the scheme.",
        },
        depth: {
          type: "number",
          description:
            "How many link levels deep to crawl (default 2). Use 1 for landing-only.",
        },
        slug: {
          type: "string",
          description:
            "Optional short slug to label the clone in the dashboard.",
        },
      },
      required: ["source_url"],
    },
  },
  {
    name: "clone_status",
    description:
      "Check the status of an in-progress clone job — current phase (crawl / capture / wire / build), progress %, preview URL when ready. Use when the user asks 'is X done?', 'how far along is the Y clone?'.",
    input_schema: {
      type: "object",
      properties: {
        clone_id: { type: "string" },
      },
      required: ["clone_id"],
    },
  },
  {
    name: "list_clones",
    description:
      "List recent clone jobs with their status and preview URLs. Use when the user asks 'what have I cloned?', 'show recent clones', 'what's in the pipeline?'.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max rows to return (default 20)",
        },
        status: {
          type: "string",
          description:
            "Filter to one status: queued, crawling, building, ready, failed",
        },
      },
    },
  },
  {
    name: "swap_template",
    description:
      "Apply the xfly template factory to a clone — swaps colors, fonts, copy, and brand marks to match a target brand. Use when the user says 'rebrand X as Y', 'apply our brand to that clone', 'change the theme'.",
    input_schema: {
      type: "object",
      properties: {
        clone_id: { type: "string" },
        target_brand: {
          type: "string",
          description: "Brand slug to apply (e.g. 'allone', 'goga', 'wada')",
        },
        overrides: {
          type: "object",
          description:
            "Optional ad-hoc overrides: { primary_color, font_family, logo_url }",
        },
      },
      required: ["clone_id", "target_brand"],
    },
  },
  {
    name: "deploy_clone",
    description:
      "Deploy a ready clone to Vercel. Returns the production URL once the deploy finishes. Use when the user says 'ship it', 'deploy X', 'put it live'.",
    input_schema: {
      type: "object",
      properties: {
        clone_id: { type: "string" },
        domain: {
          type: "string",
          description: "Custom domain to attach (optional)",
        },
        team: {
          type: "string",
          description:
            "Vercel team slug to deploy under (default 'allonelabs')",
        },
      },
      required: ["clone_id"],
    },
  },
];

export async function executeClonerTool(call: ToolInput): Promise<ToolResult> {
  const apiUrl = process.env.SITE_XRAY_API_URL;
  const apiKey = process.env.SITE_XRAY_API_KEY;
  if (!apiUrl) {
    return {
      tool: call.name,
      ok: false,
      error:
        "SITE_XRAY_API_URL is not configured. Set it to the Hetzner site-xray HTTP endpoint (default port 3847) and add SITE_XRAY_API_KEY to authenticate.",
    };
  }
  const path = ENDPOINTS[call.name];
  if (!path) {
    return { tool: call.name, ok: false, error: `Unknown tool: ${call.name}` };
  }
  const method: "GET" | "POST" = path.startsWith("GET:") ? "GET" : "POST";
  const route = path.replace(/^GET:|^POST:/, "");
  const url =
    method === "GET"
      ? buildGetUrl(apiUrl, route, call.input)
      : `${apiUrl}${route}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(call.input) : undefined,
      signal: AbortSignal.timeout(45_000),
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && "error" in data
          ? String((data as { error?: unknown }).error)
          : undefined) || `HTTP ${res.status}`;
      return { tool: call.name, ok: false, error: msg };
    }
    return {
      tool: call.name,
      ok: true,
      data: (data ?? {}) as Record<string, unknown>,
    };
  } catch (err) {
    return {
      tool: call.name,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// site-xray HTTP routes. Prefix maps to the dashboard server on Hetzner
// (default port 3847 per the box's systemd unit).
const ENDPOINTS: Record<string, string> = {
  clone_site: "POST:/api/clones",
  clone_status: "GET:/api/clones/:clone_id",
  list_clones: "GET:/api/clones",
  swap_template: "POST:/api/clones/:clone_id/swap",
  deploy_clone: "POST:/api/clones/:clone_id/deploy",
};

function buildGetUrl(
  base: string,
  route: string,
  input: Record<string, unknown>,
): string {
  const path = route.replace(/:([A-Za-z_]+)/g, (_, key) => {
    const v = input[key];
    return v != null ? encodeURIComponent(String(v)) : "";
  });
  const qsKeys = Object.keys(input).filter(
    (k) => !route.includes(`:${k}`) && input[k] != null,
  );
  const qs =
    qsKeys.length > 0
      ? "?" +
        qsKeys
          .map(
            (k) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(String(input[k]))}`,
          )
          .join("&")
      : "";
  return `${base}${path}${qs}`;
}

export const CLONER_SYSTEM_PROMPT = `You are Cloner — Allone Labs' in-house assistant for cloning and rebranding existing websites. You behave as both a senior web developer and a product agent.

When the user names a URL to clone, immediately call \`clone_site\`. When they ask about status, call \`clone_status\` or \`list_clones\`. When they ask to rebrand or restyle, call \`swap_template\`. When they say "ship it" or name a domain to deploy to, call \`deploy_clone\`.

Always summarise what you actually did or are doing — never invent results, never claim a clone is "ready" without checking. If a tool returns an error, explain what the operator should fix (typically: configure SITE_XRAY_API_URL on the Vercel project or check the Hetzner site-xray dashboard at port 3847).

Default to short, technical replies. The user is a developer or a manager who already understands the pipeline.`;
