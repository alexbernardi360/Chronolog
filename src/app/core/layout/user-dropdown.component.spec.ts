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

  const session = (email: string) => ({
    data: { session: { user: { email } } },
  });

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
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('span')!.textContent,
    ).toBe('A');
  });

  it('upper-cases an already lowercase initial from any address', async () => {
    getSession.mockResolvedValue(session('zoe@example.com'));

    await render();

    expect(dropdown.avatarPlaceholder()).toBe('Z');
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

  it('logs out from the menu item', async () => {
    await render();

    const logout = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'),
    ).find((a) => a.textContent!.trim() === 'Logout')!;
    logout.click();
    await fixture.whenStable();

    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['login']);
  });
});
