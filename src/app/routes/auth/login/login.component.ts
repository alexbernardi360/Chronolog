import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  async onSubmit() {
    if (this.loginForm.invalid) return;

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
