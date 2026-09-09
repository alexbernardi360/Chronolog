import { readFileSync } from "node:fs";

/**
 * Stands in for the ESLint this repo deliberately does not have.
 *
 * Only absolute, mechanically checkable rules from CLAUDE.md and
 * .claude/angular-best-practices.md live here — anything needing judgement
 * belongs in the angular-conventions-reviewer subagent instead. Every rule
 * must be false-positive-free against the current src/ tree.
 */
const RULES = [
  {
    re: /\bstandalone:\s*true/,
    msg: "`standalone: true` is the default in Angular v20+ — remove it.",
  },
  {
    re: /changeDetection:\s*ChangeDetectionStrategy\.OnPush/,
    msg: "OnPush is the default in Angular v22+ — remove the explicit `changeDetection`.",
  },
  {
    re: /\[?ngClass\]?\s*=/,
    msg: 'Do not use ngClass — use `[class.foo]="expr"` bindings (and add foo to the safelist).',
  },
  {
    re: /\[?ngStyle\]?\s*=/,
    msg: 'Do not use ngStyle — use `[style.foo]="expr"` bindings.',
  },
  {
    re: /@HostBinding|@HostListener/,
    msg: "Do not use @HostBinding/@HostListener — use the `host` object in the decorator.",
  },
  {
    re: /\*ngIf|\*ngFor|\*ngSwitch/,
    msg: "Use native control flow (@if / @for / @switch) instead of structural directives.",
  },
  {
    re: /constructor\s*\(\s*(private|public|protected|readonly)\s/,
    msg: "Use the inject() function instead of constructor injection.",
  },
];

/**
 * @returns {string[]} problem descriptions, empty when clean
 */
export function lintConventions(abs, rel) {
  if (!/\.(ts|html)$/i.test(abs)) return [];
  if (/\.spec\.ts$/i.test(abs)) return [];

  let lines;
  try {
    lines = readFileSync(abs, "utf8").split(/\r?\n/);
  } catch {
    return [];
  }

  const problems = [];
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line))
        problems.push(`[conventions] ${rel}:${i + 1} — ${rule.msg}`);
    }
  });
  return problems;
}
