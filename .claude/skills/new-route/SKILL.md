---
name: new-route
description: Scaffold a new authenticated page (route + component + data access + spec) following Chronolog's established structure.
disable-model-invocation: true
---

# Adding a route to Chronolog

A page here is a fixed sequence. Do all of it — the steps that get skipped are the safelist
entry and the spec, and both fail silently.

Ask for the feature name first if it was not given. Use it kebab-cased for the route path
and folder, PascalCase for the component.

## 1. Component folder

Create `src/app/routes/<feature>/<feature>.component.ts`. One folder per route; nest a
subfolder only when the feature has several pages (see `routes/time-logs/time-logs-grid/`).

- Selector prefix `core-` under `core/`, `shared-` under `shared/`; route components follow
  the existing feature naming.
- No `standalone: true`, no explicit `changeDetection` — both are defaults in v22.
- `styles: []` always. All styling is Tailwind + daisyUI utility classes.
- Inline `template` if it is small; a sibling `<feature>.component.html` once it grows.
- `inject()` for dependencies, signals for state.

## 2. Register the route

In `src/app/app.routes.ts`, add a child of the `''` route — the one guarded by `authGuard`
that loads `MainLayoutComponent` — placed **before** the `// #region Errors` block:

```ts
{
  path: '<feature>',
  loadComponent: () =>
    import('./routes/<feature>/<feature>.component').then(
      (m) => m.<Feature>Component,
    ),
},
```

Always `loadComponent` with a dynamic import; never an eager import. Put it under the
`login` tree instead only if the page must be reachable while signed out.

## 3. Data access

Add methods to the existing service if the feature reads `time_records` or `daily_works`;
create a new service under `shared/services/` only for a genuinely new table.

**Match the established contract exactly**: wrap the Supabase promise in `from(...)`,
`map` the payload, and end in a `catchError` that logs and emits an empty array / `null` /
`of()`. Callers see "no data", never an error. Deviating is a deliberate decision, not a
default — if this feature must surface failures to the user, say so explicitly rather than
quietly changing the pattern.

Pagination is offset-based via `.range()`, with a separate `{ count: 'exact', head: true }`
query for the total.

## 4. Load it in the component

```ts
readonly page = signal(1);
readonly data = rxResource({
  params: () => ({ page: this.page() }),
  stream: ({ params }) => this.service.getThing(PAGE_SIZE, params.page),
});
```

Call `this.data.reload()` after every mutation. Reuse `PagerComponent` for paging rather
than rolling new controls.

## 5. Navigation

If the page needs a navbar entry, add it in `core/layout/` — and note that the active link
uses `menu-active`, which is already safelisted.

## 6. Safelist any dynamic classes

Every class applied via `[class.x]` (or built as a string) must be added to the `safelist`
in `.postcssrc.json`, sorted. Tailwind only scans for literal class names; anything dynamic
is tree-shaken out of the production build otherwise — it will work under `ng serve` and
be missing in prod. The `PostToolUse` hook catches the `[class.x]` form; string-built names
are on you.

## 7. Spec

Write a sibling `<feature>.component.spec.ts` — **invoke the `write-spec` skill** for the
environment traps (never construct a real data service, stub `Dialog` on the component,
`detectChanges()` then `whenStable()` to settle a `rxResource`).

Skip the spec only for a genuinely presentational component with no behaviour, as with
`HomeComponent` and `NotFoundComponent`.

## 8. Verify

```bash
npx ng test --include='**/<feature>.component.spec.ts'
npm run build     # NOTE: defaults to the production configuration
```

The production build is what proves the safelist entry was needed and correct. Then check
the page in both the light and dark themes; run the `a11y-reviewer` agent if the page has
any real interaction.
