# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chronolog is an Angular 22 PWA for logging work entry/exit times, backed by Supabase (Postgres + Auth) and deployed to Firebase Hosting.

## Commands

```bash
npm start                 # ng serve → http://localhost:4200 (development configuration)
npm run build             # ng build — NOTE: defaults to the *production* configuration
npm run watch             # incremental build, development configuration
npm test                  # ng test → Vitest, jsdom environment (watch mode in a TTY, single run otherwise)
npx ng test --no-watch                               # force a single run
npx ng test --include='**/pager.component.spec.ts'   # run a single spec
npx ng test --browsers=ChromeHeadless                # run in a real browser instead of jsdom
npx ng test --coverage                               # coverage report
npx prettier --write .    # formatting (Prettier is the only style tool; no ESLint is configured)
```

Node **>= 22.22.3** is required (Angular 22 engines: `^22.22.3 || ^24.15.0 || >=26.0.0`). CI pins Node 24.x.

## Testing

Unit tests run on the `@angular/build:unit-test` builder with the **Vitest** runner — migrated off Karma/Jasmine during the Angular 22 upgrade, since the Karma builder is deprecated. `jsdom` provides the DOM; pass `--browsers` to run in a real browser instead. Specs use Vitest globals (`describe`/`it`/`expect`) — `tsconfig.spec.json` sets `"types": ["vitest/globals"]`.

There are currently **no `.spec.ts` files** in the repo, and `ng test` therefore _fails_ with `No tests found matching the following patterns` until one exists — that error means "no specs", not a broken setup. The schematics in `angular.json` do not set `skipTests`, so `ng generate` emits a spec alongside new files by default.

The test build uses the `testing` configuration of the `build` target (`aot: false`, no optimization, zone.js testing polyfills).

## Environment setup (required before the app runs)

`src/environments/environment.ts` is gitignored. Copy `src/environments/environment.template.ts` to `environment.ts` and fill in `supabaseUrl` / `supabaseKey`.

There is a single environment file for every configuration — no `fileReplacements`, no `environment.prod.ts`. Dev/prod behaviour comes from Angular's `isDevMode()` (see `app.config.ts`), not from a `production` flag. In CI, `.github/workflows/firebase-hosting-merge.yml` generates `environment.ts` from the `SUPABASE_URL` / `SUPABASE_ANON_KEY` repo secrets before building.

Git history shows an earlier `@ngx-env/builder` setup reading `import.meta.env.NG_APP_*`; that is gone — configuration now flows only through the `environment` object.

## Architecture

**Bootstrap.** Fully standalone — no NgModules anywhere. `main.ts` → `bootstrapApplication(AppComponent, appConfig)`; `app.config.ts` provides the router, zone change detection with event coalescing, and the service worker (production builds only). The app is still zone-based (`provideZoneChangeDetection` + `zone.js`), not zoneless.

**Routing (`app.routes.ts`).** Two top-level trees:

- `''` — guarded by `authGuard`, loads `MainLayoutComponent` (navbar + `<router-outlet>`) and holds all app pages as children (`home`, `time-logs`, `time-logs/new`, `time-logs/edit/:id`, `daily-works`, `error/404`).
- `login` — guarded by `unauthGuard`.

Every route uses `loadComponent` with a dynamic import; the guards (`core/providers/`) are `async CanActivateFn`s that await the Supabase session and return a `router.navigate(...)` promise on failure.

**Directory layout under `src/app/`:**

- `core/layout/` — app shell (navbar, theme selector, user dropdown), selector prefix `core-`
- `core/providers/` — route guards
- `routes/<feature>/` — page components, one folder per route
- `shared/components/` and `shared/dialogs/` — reusable UI, selector prefix `shared-`
- `shared/domain/` — plain interfaces (`TimeLog`, `WorkSummary`, `Profile`) and pure util functions
- `shared/services/` — Supabase data access and dialog helpers

**Data layer.** Each service (`AuthService`, `TimeLogsService`, `DailyWorksService`) calls `createClient()` itself rather than sharing an injected client. Data services wrap the Supabase promise in `from(...)` and return an Observable; the important consequence is that **errors are swallowed** — every operation ends in `catchError` that logs to the console and emits an empty array / `null` / `of()`. Callers therefore see "no data" rather than a failure. Preserve or deliberately change that contract when touching these services.

Supabase tables: `time_records` (id, created_at, updated_at, timestamp, type, note) and `daily_works` (day, total_hours, is_valid — a day-level aggregate). Pagination is offset-based via `.range()`, with a separate `count: 'exact', head: true` query for the total.

**Component conventions.** `inject()` over constructor injection, and signals throughout — `signal`/`computed` for state, `input.required()`/`model()` for I/O, and `rxResource({ params, stream })` for loading data (call `.reload()` after mutations). Small components use an inline `template`; anything larger has a sibling `.component.html`. Styles are always `styles: []` — all styling is utility classes.

No component sets `changeDetection` explicitly: **`OnPush` is the default in Angular v22+**, so the annotation was removed everywhere. Only reach for `ChangeDetectionStrategy.Eager` if a component genuinely needs the legacy always-check behaviour.

**Dialogs.** Built on `@angular/cdk/dialog`. `CustomDialogService.show(data)` is the promise-based confirm/alert helper; feature dialogs (e.g. `QuickInsertDialogComponent`) are opened directly with `Dialog.open<boolean>(...)` and communicate results through `dialogRef.close(...)`.

**Forms.** The existing forms are reactive forms with typed `FormControl`s, exposed to templates via getters. The submit pattern is: bail on `invalid` → `formGroup.disable()` + `submitting.set(true)` → `finalize()` re-enables. For _new_ forms prefer Signal Forms (`@angular/forms/signals`), stable as of v22 — see the Angular guidelines below.

## Styling

Tailwind CSS v4 + daisyUI, configured CSS-first in `src/styles.css` (`@import "tailwindcss"; @plugin "daisyui";`) — there is **no `tailwind.config.js`**. Tailwind runs through PostCSS via `.postcssrc.json`.

Any daisyUI/Tailwind class applied dynamically (`[class.badge-success]`, string-built class names) will be tree-shaken away unless it is listed in the `safelist` in `.postcssrc.json`. Add new ones there.

Theming: daisyUI `light`/`dark` via `data-theme` on `<html>`, toggled by `ThemeSelectorComponent`, persisted to `localStorage` through `getTheme`/`setTheme` in `shared/domain/common.utils.ts`, and mirrored into the `theme-color` meta tag.

## Build & deploy

TypeScript **6.0** — Angular 22 pins `>=6.0 <6.1`, so do _not_ bump to TypeScript 7 even though npm reports it as `latest`. Full strict mode plus `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, and Angular's `strictTemplates`.

`tsconfig.app.json` and `tsconfig.spec.json` suppress the `nullishCoalescingNotNullable` and `optionalChainNotNullable` extended diagnostics — the v22 migration added these to preserve pre-v22 behaviour. Drop the suppressions to opt into the new warnings.

Production builds enforce a 1.5 MB warn / 2 MB error initial bundle budget and emit the ngsw service worker per `ngsw-config.json`.

Deployment is automatic: pushing to `main` triggers the Firebase Hosting workflow, which serves `dist/chronolog/browser` with a SPA rewrite to `/index.html`.

# Angular guidelines

@.claude/angular-best-practices.md
