import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'core-user-dropdown',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-circle avatar avatar-placeholder"
      popovertarget="user-menu"
      style="anchor-name:--user-menu"
      [attr.aria-label]="menuLabel()"
    >
      <div class="bg-neutral text-neutral-content w-10 rounded-full">
        <span>{{ avatarPlaceholder() }}</span>
      </div>
    </button>

    <div
      id="user-menu"
      popover
      style="position-anchor:--user-menu"
      class="dropdown dropdown-end rounded-box bg-base-300 w-56 shadow-lg"
    >
      @if (email(); as address) {
        <div class="border-base-content/10 border-b px-4 py-3">
          <p class="text-xs opacity-60">Signed in as</p>
          <p class="truncate text-sm font-medium">{{ address }}</p>
        </div>
      }

      <ul class="menu menu-sm w-full">
        <li class="menu-disabled"><a>Profile (WIP)</a></li>
        <li class="menu-disabled"><a>Settings (WIP)</a></li>
        <li>
          <button
            type="button"
            class="text-error hover:bg-error hover:text-error-content"
            (click)="signOut()"
          >
            <shared-icon name="logout" class="size-4" />
            Logout
          </button>
        </li>
      </ul>
    </div>
  `,
  styles: [],
})
export class UserDropdownComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal<string | null>(null);

  readonly avatarPlaceholder = computed(
    () => this.email()?.[0]?.toUpperCase() ?? '?',
  );

  protected readonly menuLabel = computed(() => {
    const email = this.email();
    return email ? `Account menu for ${email}` : 'Account menu';
  });

  async ngOnInit(): Promise<void> {
    const {
      data: { session },
    } = await this.auth.getSession();

    this.email.set(session?.user.email ?? null);
  }

  async signOut() {
    await this.auth.signOut();
    await this.router.navigate(['login']);
  }
}
