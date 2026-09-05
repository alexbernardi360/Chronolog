import { beforeEach, describe, expect, it, vi } from 'vitest';
import { serviceWithClient } from '../../../testing/supabase-stub';
import { AuthService } from './auth.service';

const auth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
};

const session = { user: { email: 'someone@example.com' } };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = serviceWithClient(AuthService, { auth });
  });

  it('signs in with the given credentials', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });

    await service.signIn('someone@example.com', 'hunter2');

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'someone@example.com',
      password: 'hunter2',
    });
  });

  it('passes the sign-in result through untouched', async () => {
    const result = { data: null, error: new Error('Invalid credentials') };
    auth.signInWithPassword.mockResolvedValue(result);

    expect(await service.signIn('a@b.c', 'nope')).toBe(result);
  });

  it('delegates signOut', async () => {
    auth.signOut.mockResolvedValue({ error: null });

    await service.signOut();

    expect(auth.signOut).toHaveBeenCalled();
  });

  it('reports authenticated when a session exists', async () => {
    auth.getSession.mockResolvedValue({ data: { session } });

    expect(await service.isAuthenticated()).toBe(true);
  });

  it('reports not authenticated when the session is null', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });

    expect(await service.isAuthenticated()).toBe(false);
  });
});
