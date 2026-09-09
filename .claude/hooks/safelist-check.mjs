import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Tailwind v4 scans source for *literal* class names. A class applied only
 * through an Angular `[class.x]` binding is never seen, so it is tree-shaken
 * out of the production build — silently. No type error, no test failure,
 * no build warning; just missing styling in prod.
 *
 * The project rule (CLAUDE.md) is that every dynamically applied class is
 * listed in the `safelist` in .postcssrc.json. This enforces it.
 *
 * @returns {string[]} problem descriptions, empty when clean
 */
export function checkSafelist(abs, root) {
  if (!/\.(html|ts)$/i.test(abs)) return [];

  let safelist;
  try {
    const cfg = JSON.parse(
      readFileSync(resolve(root, ".postcssrc.json"), "utf8"),
    );
    safelist = cfg?.plugins?.["@tailwindcss/postcss"]?.safelist;
  } catch {
    return []; // no/unreadable postcss config — nothing to check against
  }
  if (!Array.isArray(safelist)) return [];

  let src;
  try {
    src = readFileSync(abs, "utf8");
  } catch {
    return [];
  }

  const used = [...src.matchAll(/\[class\.([A-Za-z0-9_-]+)\]/g)].map(
    (m) => m[1],
  );
  const missing = [...new Set(used)].filter((c) => !safelist.includes(c));
  if (!missing.length) return [];

  return [
    `[safelist] These classes are applied dynamically but are NOT in the safelist in ` +
      `.postcssrc.json, so Tailwind will tree-shake them out of the production build ` +
      `(they will work in \`ng serve\` and fail in prod): ${missing.join(", ")}.\n` +
      `  Fix: add them to plugins["@tailwindcss/postcss"].safelist, keeping it sorted.`,
  ];
}
