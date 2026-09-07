import { Route, Routes } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { authGuard } from './core/providers/auth.guard';
import { unauthGuard } from './core/providers/unauth.guard';
import { routes } from './app.routes';

const find = (list: Routes, path: string) => list.find((r) => r.path === path)!;

const children = (path: string) => find(routes, path).children ?? [];

/** Flattens the tree, keeping the routes matching `pick`. */
function collect(list: Routes, pick: (route: Route) => boolean): Route[] {
  return list.flatMap((route) => [
    ...(pick(route) ? [route] : []),
    ...collect(route.children ?? [], pick),
  ]);
}

const lazyRoutes = (list: Routes) => collect(list, (r) => !!r.loadComponent);
const eagerRoutes = (list: Routes) => collect(list, (r) => !!r.component);

describe('app routes', () => {
  it('guards the whole app shell behind authGuard', () => {
    expect(find(routes, '').canActivate).toEqual([authGuard]);
  });

  it('keeps signed-in users away from the login page', () => {
    expect(find(routes, 'login').canActivate).toEqual([unauthGuard]);
  });

  it('lands on home', () => {
    const index = find(children(''), '');

    expect(index.redirectTo).toBe('home');
    expect(index.pathMatch).toBe('full');
  });

  it('exposes the app pages as children of the guarded shell', () => {
    expect(children('').map((r) => r.path)).toEqual([
      '',
      'home',
      'time-logs',
      'daily-works',
      'error',
    ]);
  });

  it('keeps time logs on a single route, since its form is a dialog', () => {
    const timeLogs = find(children(''), 'time-logs');

    expect(timeLogs.children).toBeUndefined();
    expect(timeLogs.loadComponent).toBeDefined();
  });

  it('sends anything unknown to the 404 page', () => {
    const fallback = find(routes, '**');

    expect(fallback.redirectTo).toBe('error/404');
    expect(routes.indexOf(fallback)).toBe(routes.length - 1);
  });

  it('lazily loads every page, and each import resolves', async () => {
    const lazy = lazyRoutes(routes);

    // every page is lazy: nothing is pulled into the initial bundle
    expect(lazy).not.toHaveLength(0);
    expect(eagerRoutes(routes)).toEqual([]);

    for (const route of lazy) {
      const loaded = await route.loadComponent!();
      expect(loaded, `route "${route.path}" resolved to nothing`).toBeTruthy();
    }
  });
});
