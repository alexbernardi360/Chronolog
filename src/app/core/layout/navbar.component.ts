import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ThemeSelectorComponent } from './theme-selector.component';
import { UserDropdownComponent } from './user-dropdown.component';

interface NavLink {
  readonly path: string;
  readonly label: string;
}

@Component({
  selector: 'core-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    IconComponent,
    ThemeSelectorComponent,
    UserDropdownComponent,
  ],
  template: `
    <header class="bg-base-100 sticky top-0 z-30 shadow">
      <div class="navbar container mx-auto px-2 sm:px-4">
        <div class="navbar-start gap-1">
          <!-- #region Mobile navigation -->
          <button
            type="button"
            class="btn btn-ghost btn-circle sm:hidden"
            popovertarget="nav-menu"
            style="anchor-name:--nav-menu"
            aria-label="Open navigation menu"
          >
            <shared-icon name="menu" class="size-5" />
          </button>

          <nav
            #navMenu
            id="nav-menu"
            popover
            aria-label="Main"
            style="position-anchor:--nav-menu"
            class="dropdown dropdown-start rounded-box bg-base-300 w-56 shadow-lg"
          >
            <ul class="menu w-full">
              @for (link of links; track link.path) {
                <li>
                  <a
                    [routerLink]="link.path"
                    routerLinkActive="menu-active"
                    (click)="closeNavMenu()"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </nav>
          <!-- #endregion -->

          <a
            class="btn btn-ghost px-2 font-mono text-lg normal-case md:text-xl"
            routerLink="/"
          >
            Chronolog
          </a>
        </div>

        <div class="navbar-end gap-1">
          <!-- #region Desktop navigation -->
          <nav aria-label="Main" class="hidden sm:block">
            <ul class="menu menu-horizontal gap-1 p-0">
              @for (link of links; track link.path) {
                <li>
                  <a
                    [routerLink]="link.path"
                    routerLinkActive="menu-active"
                    class="font-normal"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </nav>
          <!-- #endregion -->

          <core-theme-selector />
          <core-user-dropdown />
        </div>
      </div>
    </header>
  `,
  styles: [],
})
export class NavbarComponent {
  private readonly navMenu = viewChild<ElementRef<HTMLElement>>('navMenu');

  protected readonly links: readonly NavLink[] = [
    { path: '/daily-works', label: 'Daily Works' },
    { path: '/time-logs', label: 'Time Logs' },
  ];

  /**
   * Following a link leaves the popover open, because navigating does not
   * light-dismiss it. Close it by hand so the menu does not cover the new page.
   */
  protected closeNavMenu(): void {
    try {
      this.navMenu()?.nativeElement.hidePopover();
    } catch {
      // Already closed, or a browser without the Popover API: nothing to do.
    }
  }
}
