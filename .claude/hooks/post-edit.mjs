import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { formatFile } from "./format-file.mjs";
import { checkSafelist } from "./safelist-check.mjs";
import { lintConventions } from "./conventions-lint.mjs";

/**
 * PostToolUse(Edit|Write) entry point.
 *
 * One process, three steps, in order: format the file, then check it. The
 * checks must run *after* the rewrite, which is why these are chained here
 * rather than registered as three sibling hooks (those run in parallel).
 *
 * Exit 0 = clean. Exit 2 = stderr is fed back to Claude to fix.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VENDORED = /^\.(claude|agents)[\/]skills[\/]/;

main().catch(() => process.exit(0)); // never let a hook crash block an edit

async function main() {
  const payload = await readStdin();
  const file = payload?.tool_input?.file_path;
  if (typeof file !== "string" || !file) return;

  const abs = isAbsolute(file) ? file : resolve(ROOT, file);
  const rel = relative(ROOT, abs);
  if (!rel || rel.startsWith("..")) return; // outside the repo
  if (VENDORED.test(rel)) return; // vendored skill docs — leave byte-identical

  await formatFile(abs);

  if (!rel.startsWith(`src${sep}`)) return; // only lint application source

  const problems = [...checkSafelist(abs, ROOT), ...lintConventions(abs, rel)];
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(2);
  }
}

async function readStdin() {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}
