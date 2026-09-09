import { readFileSync, writeFileSync } from "node:fs";

/**
 * Formats a single file with Prettier, using the repo's .prettierrc
 * (including the `angular` parser override for .html).
 *
 * Deliberately per-file: `prettier --write .` rewrites the vendored skill docs
 * under .claude/skills and .agents/skills and pollutes every diff.
 *
 * Two things this has to get right to match `npx prettier --write <file>`:
 *
 *  - `editorconfig: true`. The CLI reads .editorconfig by default; the API does
 *    not. This repo's .editorconfig carries `quote_type = single` and .prettierrc
 *    does not set `singleQuote`, so without this every string in every .ts file
 *    gets rewritten to double quotes.
 *  - `endOfLine: 'auto'`. core.autocrlf is true here, so the working tree is CRLF
 *    while the committed form is LF. Prettier's default ('lf') would rewrite every
 *    line of every file it touches for no change in what actually gets committed.
 *    'auto' keeps the file's existing endings, making the hook a true no-op on
 *    already-clean files. An explicit endOfLine in .prettierrc still wins.
 *
 * Never throws — a formatting failure must not block an edit.
 */
export async function formatFile(abs) {
  let prettier;
  try {
    prettier = await import("prettier");
  } catch {
    return; // prettier not installed yet (fresh clone, no npm install)
  }

  try {
    const info = await prettier.getFileInfo(abs, { resolveConfig: true });
    if (info.ignored || !info.inferredParser) return;

    const src = readFileSync(abs, "utf8");
    const config =
      (await prettier.resolveConfig(abs, { editorconfig: true })) ?? {};
    const out = await prettier.format(src, {
      endOfLine: "auto",
      ...config,
      filepath: abs,
    });
    if (out !== src) writeFileSync(abs, out, "utf8");
  } catch {
    // Syntax error mid-edit, unreadable file, etc. Leave it alone.
  }
}
