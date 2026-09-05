import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../shared/services/auth.service';
import { UserDropdownComponent } from './user-dropdown.component';

describe('UserDropdownComponent', () => {
  const getSession = vi.fn();
  const signOut = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));
  let fixture: ComponentFixture<UserDropdownComponent>;
  let dropdown: UserDropdownComponent;

  const host = () => fixture.nativeElement as HTMLElement;

  const session = (email: string | undefined) => ({
    data: { session: { user: { email } } },
  });

  const logoutButton = () =>
    Array.from(host().querySelectorAll('button')).find(
      (b) => b.textContent!.trim() === 'Logout',
    )!;

  async function render() {
    fixture = TestBed.createComponent(UserDropdownComponent);
    dropdown = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    getSession.mockReset().mockResolvedValue(session('alessandro@example.com'));
    signOut.mockReset().mockResolvedValue({ error: null });
    navigate.mockClear();

    TestBed.configureTestingModule({
      imports: [UserDropdownComponent],
      providers: [
        { provide: AuthService, useValue: { getSession, signOut } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  it('shows the first letter of the signed-in email, upper-cased', async () => {
    await render();

    expect(dropdown.avatarPlaceholder()).toBe('A');
    expect(host().querySelector('span')!.textContent).toBe('A');
  });

  it('upper-cases an already lowercase initial from any address', async () => {
    getSession.mockResolvedValue(session('zoe@example.com'));

    await render();

    expect(dropdown.avatarPlaceholder()).toBe('Z');
  });

  it('falls back to a placeholder when the session carries no email', async () => {
    getSession.mockResolvedValue(session(undefined));

    await render();

    expect(dropdown.avatarPlaceholder()).toBe('?');
    expect(host().querySelector('button')!.getAttribute('aria-label')).toBe(
      'Account menu',
    );
  });

  it('names the trigger after the signed-in address', async () => {
    await render();

    expect(host().querySelector('button')!.getAttribute('aria-label')).toBe(
      'Account menu for alessandro@example.com',
    );
  });

  it('shows the signed-in address in the menu', async () => {
    await render();

    expect(host().querySelector('#user-menu')!.textContent).toContain(
      'alessandro@example.com',
    );
  });

  it('signs out and then sends the user to the login page', async () => {
    await render();

    await dropdown.signOut();

    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['login']);
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0],
    );
  });

  it('logs out from a real button, so the keyboard reaches it', async () => {
    await render();

    const logout = logoutButton();
    expect(logout.tagName).toBe('BUTTON');

    logout.click();
    await fixture.whenStable();

    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['login']);
  });
});
