import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../shared/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const signIn = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));
  let fixture: ComponentFixture<LoginComponent>;
  let login: LoginComponent;

  const fillValidForm = () => {
    login.email.setValue('someone@example.com');
    login.password.setValue('hunter2');
  };

  beforeEach(() => {
    signIn.mockReset().mockResolvedValue({ error: null });
    navigate.mockClear();

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: { signIn } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    login = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('validation', () => {
    it('starts invalid with both fields empty', () => {
      expect(login.loginForm.invalid).toBe(true);
      expect(login.email.hasError('required')).toBe(true);
      expect(login.password.hasError('required')).toBe(true);
    });

    it('rejects a malformed email', () => {
      login.email.setValue('not-an-email');

      expect(login.email.hasError('email')).toBe(true);
    });

    it('becomes valid once both fields are filled', () => {
      fillValidForm();

      expect(login.loginForm.valid).toBe(true);
    });

    it('keeps the submit button disabled while invalid', () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;

      expect(button.disabled).toBe(true);

      fillValidForm();
      fixture.detectChanges();

      expect(button.disabled).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('does not call the API while the form is invalid', async () => {
      await login.onSubmit();

      expect(signIn).not.toHaveBeenCalled();
    });

    it('signs in with the entered credentials', async () => {
      fillValidForm();

      await login.onSubmit();

      expect(signIn).toHaveBeenCalledWith('someone@example.com', 'hunter2');
    });

    it('navigates home on success', async () => {
      fillValidForm();

      await login.onSubmit();

      expect(navigate).toHaveBeenCalledWith(['home']);
      expect(login.errorMessage()).toBeNull();
    });

    it('shows the API error instead of navigating', async () => {
      signIn.mockResolvedValue({ error: new Error('Invalid credentials') });
      fillValidForm();

      await login.onSubmit();

      expect(login.errorMessage()).toBe('Invalid credentials');
      expect(login.errorMessageVisible()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('renders the error message in an alert', async () => {
      signIn.mockResolvedValue({ error: new Error('Invalid credentials') });
      fillValidForm();

      await login.onSubmit();
      fixture.detectChanges();

      const alert = (fixture.nativeElement as HTMLElement).querySelector(
        '.alert-error',
      );
      expect(alert!.textContent).toContain('Invalid credentials');
    });

    it('re-enables the form and clears submitting whatever happens', async () => {
      signIn.mockRejectedValue(new Error('network down'));
      fillValidForm();

      await login.onSubmit();

      expect(login.loginForm.enabled).toBe(true);
      expect(login.submitting()).toBe(false);
      expect(login.errorMessage()).toBe('network down');
    });
  });

  it('hides the alert again when dismissed', async () => {
    signIn.mockResolvedValue({ error: new Error('nope') });
    fillValidForm();
    await login.onSubmit();

    login.errorMessage.set(null);

    expect(login.errorMessageVisible()).toBe(false);
  });
});
