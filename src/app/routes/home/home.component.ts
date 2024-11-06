import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="flex items-center justify-center min-h-screen">
    <button class="btn btn-error" (click)="signOut()">Logout</button>
  </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  async signOut() {
    await this.auth.signOut();
    await this.router.navigate(['login']);
  }
}
