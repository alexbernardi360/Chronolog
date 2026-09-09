---
name: write-spec
description: Write or fix a Vitest unit spec in this repo. Use whenever adding a spec, changing an existing one, or debugging a spec that fails for environment reasons rather than logic ones — the Angular 22 + Vitest builder here has four traps that produce confusing failures.
---

# Writing a spec in Chronolog

Unit tests run on the `@angular/build:unit-test` builder with the **Vitest** runner and a
**jsdom** DOM. This is not a stock Vitest setup, and four things about it bite. Get these
right and specs are ordinary; get one wrong and the failure will not point at its cause.

```bash
npx ng test --no-watch                                # whole suite, single run
npx ng test --include='**/pager.component.spec.ts'    # one spec
npx ng test --browsers=ChromeHeadless                 # real browser instead of jsdom
npx ng test --coverage
```

## The four traps

**1. Import the globals explicitly.**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
```

The runner injects them and `tsconfig.spec.json` declares `vitest/globals`, so a spec
without the import still _runs_. But the root `tsconfig.json` has no `include`, so it
swallows every `.ts` in the repo, and editors resolve specs against it rather than
`tsconfig.spec.json`. Without the import your editor reports `Cannot find name 'describe'`
on every line. Always import.

**2. Never let a real data service be constructed.** `AuthService`, `TimeLogsService` and
`DailyWorksService` each run `createClient()` in a _field initializer_, against the real
`environment.ts` — which throws outright if it still holds template placeholders.

- _Testing the service itself_ — build it off the prototype so the initializer never runs:

  ```ts
  import { queryStub, serviceWithClient } from "../../../testing/supabase-stub";

  const supabase = { from: vi.fn() };
  const service = serviceWithClient(TimeLogsService, supabase);

  const stub = queryStub({ data: [ROW], error: null });
  supabase.from.mockReturnValue(stub);

  await firstValueFrom(service.getTimeLogs(10, 3));
  expect(stub.args("range")).toEqual([20, 29]); // records the chained call
  ```

  `queryStub` fakes the chainable builder (`select`, `order`, `range`, `eq`, `gte`, `lt`,
  `insert`, `update`, `delete`) and resolves to whatever you hand it. `.args(method)`
  returns what the service passed, or `undefined` if it never called it.

- _Testing a component that injects one_ — override the provider with a plain object
  holding only the methods that component uses:

  ```ts
  providers: [{ provide: DailyWorksService, useValue: { getDailyWorks, getDailyWorksCount } }];
  ```

**3. No `vi.mock()` / `vi.hoisted()`.** The builder bundles each spec inside a
`__commonJS("…spec.ts")` wrapper before Vitest parses it, so those calls are never at a
module's top level. Vitest warns _"This will become an error in a future version."_ The
provider-override and `serviceWithClient` seams above mean you never need them.

**4. Stub `Dialog` on the component, not in root.** A component importing `DialogModule`
gets `DialogModule`'s own `Dialog` provider in its standalone injector, which shadows any
root-level stub:

```ts
TestBed.overrideComponent(DailyWorksComponent, {
  add: { providers: [{ provide: Dialog, useValue: { open } }] },
});
```

## Settling a `rxResource`

After changing a signal a `rxResource` depends on, `whenStable()` **alone does not trigger
the refetch**. Always both, in this order:

```ts
const settle = async () => {
  fixture.detectChanges();
  await fixture.whenStable();
};
```

## Remember

- `localStorage` does not exist in this jsdom; `src/test-setup.ts` installs an in-memory
  `Storage` per worker. It defines the global unconditionally on purpose — merely _reading_
  `globalThis.localStorage` to feature-detect trips Node's `ExperimentalWarning`.
- The services swallow errors by design (`catchError` → empty array / `null` / `of()`), so
  assert on the _empty_ result, and `vi.spyOn(console, 'error').mockImplementation(() => {})`
  in `beforeEach` to keep the expected logging out of the output.
- Every unit with logic gets a sibling `.spec.ts`. Purely presentational components
  (`AppComponent`, `MainLayoutComponent`, `HomeComponent`, `NotFoundComponent`) have none —
  do not add empty "should create" specs for them.
- Prefer small DOM query helpers (`const bodyRows = () => host().querySelectorAll('tbody tr')`)
  over repeating selectors, matching the existing specs.
- One warning is expected and must stay: _"Not implemented: HTMLFormElement's requestSubmit()"_,
  logged once by `custom-dialog.component.spec.ts`. Do not silence it.
