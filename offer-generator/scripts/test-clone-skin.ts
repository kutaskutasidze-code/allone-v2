// Slice 3 smoke: prove cloner + enricher + skinner work end-to-end against
// real subprocess calls.
//
// Usage:
//   pnpm tsx scripts/test-clone-skin.ts <reference-url> <lead-site-url> [<lead-email>]
//
// Example:
//   pnpm tsx scripts/test-clone-skin.ts https://wada-ama.org https://acme-clinic.com info@acme-clinic.com
//
// Produces:
//   /tmp/refclone-<hostname>-<ts>/   (xray clone of reference-url)
//   /tmp/demo-<hostname>-<ts>/       (xfly skin onto the cloned reference)
//
// Exits 0 if xfly-check score ≥ 95.

import { cloneSite } from "../src/cloner/index.js";
import { skinClone } from "../src/skinner/index.js";
import { enrichCompanySpec, classifySegment } from "../src/enricher/index.js";
import { analyzeWebsite } from "../src/analyzer/index.js";

async function main() {
  const [refUrl, leadUrl, leadEmail] = process.argv.slice(2);
  if (!refUrl || !leadUrl) {
    console.error(
      "Usage: pnpm tsx scripts/test-clone-skin.ts <reference-url> <lead-site-url> [<lead-email>]",
    );
    process.exit(2);
  }

  const ts = Date.now();
  const refHost = new URL(refUrl).hostname.replace(/\./g, "-");
  const leadHost = new URL(leadUrl).hostname.replace(/\./g, "-");
  const refOut = `/tmp/refclone-${refHost}-${ts}`;
  const demoOut = `/tmp/demo-${leadHost}-${ts}`;

  console.log(`\n[1/4] cloning reference ${refUrl} → ${refOut}`);
  const cloneRes = await cloneSite({
    url: refUrl,
    outDir: refOut,
    maxPages: 5,
    onProgress: (e) => {
      if (e.type === "phase") console.log(`  · ${e.phase}`);
    },
  });
  if (!cloneRes.ok) {
    console.error(`  ✗ clone failed (exit ${cloneRes.exitCode})`);
    process.exit(1);
  }
  console.log(`  ✓ clone done`);

  console.log(`\n[2/4] analyzing lead site ${leadUrl}`);
  const analysis = await analyzeWebsite(leadUrl, async (step, pct) => {
    console.log(`  · ${step} (${pct}%)`);
  });
  console.log(
    `  ✓ analysis: company=${analysis.company.name}, industry=${analysis.company.industry}`,
  );

  console.log(`\n[3/4] enriching company spec + classifying segment`);
  const company = await enrichCompanySpec(
    leadEmail ?? `hello@${new URL(leadUrl).hostname}`,
    analysis.company.name || "Lead",
    analysis.company.name || null,
    analysis,
  );
  const segment = await classifySegment(analysis);
  console.log(
    `  ✓ spec: ${JSON.stringify({ name: company.name, color: company.color, logo: company.logo?.slice(0, 60), segment })}`,
  );

  console.log(`\n[4/4] skinning clone with company spec → ${demoOut}`);
  const skinRes = await skinClone({
    refPath: refOut,
    company,
    outDir: demoOut,
    onProgress: (e) => {
      if (e.type === "phase") console.log(`  · ${e.phase}`);
    },
  });
  console.log(
    `  ${skinRes.ok ? "✓" : "✗"} xfly-check score: ${skinRes.checkScore}/100`,
  );
  if (skinRes.warnings.length) {
    console.log(`  warnings (${skinRes.warnings.length}):`);
    skinRes.warnings.slice(0, 5).forEach((w) => console.log(`    - ${w}`));
  }

  console.log(`\nDone. Open ${demoOut}/index.html to inspect.`);
  process.exit(skinRes.ok ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
