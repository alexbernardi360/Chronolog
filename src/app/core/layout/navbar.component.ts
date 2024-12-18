import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeSelectorComponent } from './theme-selector.component';
import { UserDropdownComponent } from './user-dropdown.component';

@Component({
  selector: 'core-navbar',
  imports: [RouterLink, ThemeSelectorComponent, UserDropdownComponent],
  template: `
    <div class="navbar sticky top-0 bg-base-100 z-10 shadow-md ">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl" routerLink="/">
          <div class="inline-flex text-lg md:text-2xl font-mono">Chronolog</div>
        </a>
      </div>

      <div class="flex-none gap-2">
        <div class="flex-none items-center">
          <a
            class="btn btn-ghost drawer-button font-normal"
            routerLink="/time-logs"
          >
            Time Logs
          </a>
        </div>

        <core-theme-selector />
        <core-user-dropdown />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {}
