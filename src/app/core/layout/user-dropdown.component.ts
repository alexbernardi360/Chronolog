import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'core-user-dropdown',
  imports: [],
  template: `
    <div class="dropdown dropdown-end">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-circle avatar avatar-placeholder"
      >
        <div class="bg-neutral text-neutral-content w-10 rounded-full">
          <span>{{ avatarPlaceholder() }}</span>
        </div>
      </div>

      <ul
        tabindex="0"
        class="menu menu-sm dropdown-content bg-base-300 rounded-box z-1 mt-3 w-52 p-2 shadow-sm"
      >
        <li class="menu-disabled"><a>Profile (WIP)</a></li>
        <li class="menu-disabled"><a>Settings (WIP)</a></li>
        <li>
          <a
            class="text-error hover:bg-error hover:text-error-content"
            (click)="signOut()"
          >
            Logout
          </a>
        </li>
      </ul>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDropdownComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  avatarPlaceholder = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    var {
      data: { session },
    } = await this.auth.getSession();
    this.avatarPlaceholder.set(session!.user.email![0].toUpperCase());
  }

  async signOut() {
    await this.auth.signOut();
    await this.router.navigate(['login']);
  }
}
