import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../shared/services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const isAuthenticated = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    isAuthenticated.mockReset();
    navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  it('lets an authenticated user through', async () => {
    isAuthenticated.mockResolvedValue(true);

    expect(await run()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirects an anonymous user to the login page', async () => {
    isAuthenticated.mockResolvedValue(false);

    await run();

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
