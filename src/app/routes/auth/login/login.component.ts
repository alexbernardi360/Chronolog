import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.component.html',
  styles: [],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  errorMessageVisible = computed(() => this.errorMessage() != null);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get email() {
    return this.loginForm.controls.email;
  }
  get password() {
    return this.loginForm.controls.password;
  }

  /** Reactive form controls are not signals, so these re-read on every check. */
  get emailInvalid() {
    return this.email.invalid && (this.email.dirty || this.email.touched);
  }
  get passwordInvalid() {
    return (
      this.password.invalid && (this.password.dirty || this.password.touched)
    );
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      // The submit button stays enabled so the form can say what is missing
      // rather than leaving the user guessing at a dead control.
      this.loginForm.markAllAsTouched();
      return;
    }

    try {
      this.loginForm.disable();
      this.submitting.set(true);

      const email = this.loginForm.value.email as string;
      const password = this.loginForm.value.password as string;
      const { error } = await this.auth.signIn(email, password);

      if (error) throw error;

      this.router.navigate(['home']);
    } catch (error) {
      if (error instanceof Error) {
        this.errorMessage.set(error.message);
      }
    } finally {
      this.loginForm.enable();
      this.submitting.set(false);
    }
  }
}
