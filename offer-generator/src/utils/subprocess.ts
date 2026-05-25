import { spawn } from "node:child_process";
import type { ProgressHandler } from "../types/demo.js";

export interface SpawnNodeOpts {
  script: string;
  args: string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  onProgress?: ProgressHandler;
  // Optional regex to recognize phase boundaries in stdout lines.
  // Matches the xray-pipeline convention: `━━━ Phase Name ━━━`.
  phaseRegex?: RegExp;
}

export interface SpawnResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
}

// Streams a node subprocess line-by-line, emitting ProgressEvents through
// opts.onProgress. Captures full stdout/stderr for callers that need to
// parse final output (xfly-check score, deploy URL, validation table).
//
// Modeled after ~/Projects/founder-brain/src/xray.ts.
export function spawnNodeScript(opts: SpawnNodeOpts): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const emit = (e: Parameters<ProgressHandler>[0]) => {
      if (opts.onProgress) {
        try {
          opts.onProgress(e);
        } catch {}
      }
    };

    const child = spawn("node", [opts.script, ...opts.args], {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
    });

    let stdoutBuf = "";
    let stderrBuf = "";
    let stdoutAll = "";
    let stderrAll = "";
    const phaseRegex = opts.phaseRegex ?? /^━━━ (.+?) ━━━$/;

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdoutAll += text;
      stdoutBuf += text;
      const lines = stdoutBuf.split("\n");
      stdoutBuf = lines.pop() || "";
      for (const line of lines) {
        const phase = line.match(phaseRegex);
        if (phase) emit({ type: "phase", phase: phase[1].trim() });
        else emit({ type: "log", line });
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderrAll += text;
      stderrBuf += text;
      const lines = stderrBuf.split("\n");
      stderrBuf = lines.pop() || "";
      for (const line of lines) {
        if (line.trim()) emit({ type: "log", line: `[stderr] ${line}` });
      }
    });

    child.on("error", (e) => {
      emit({ type: "error", error: e.message });
      resolve({
        ok: false,
        exitCode: -1,
        stdout: stdoutAll,
        stderr: stderrAll,
      });
    });

    child.on("close", (code) => {
      if (stdoutBuf) {
        emit({ type: "log", line: stdoutBuf });
        stdoutAll += stdoutBuf;
      }
      if (stderrBuf) {
        emit({ type: "log", line: `[stderr] ${stderrBuf}` });
        stderrAll += stderrBuf;
      }
      const ok = code === 0;
      emit({ type: "done", ok, exitCode: code ?? -1 });
      resolve({
        ok,
        exitCode: code ?? -1,
        stdout: stdoutAll,
        stderr: stderrAll,
      });
    });
  });
}
