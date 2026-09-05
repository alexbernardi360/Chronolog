import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../shared/services/auth.service';
import { unauthGuard } from './unauth.guard';

describe('unauthGuard', () => {
  const isAuthenticated = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));

  const run = () =>
    TestBed.runInInjectionContext(() =>
      unauthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
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

  it('lets an anonymous user reach the login page', async () => {
    isAuthenticated.mockResolvedValue(false);

    expect(await run()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends an already authenticated user to home', async () => {
    isAuthenticated.mockResolvedValue(true);

    await run();

    expect(navigate).toHaveBeenCalledWith(['/home']);
  });
});
