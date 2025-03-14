import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeSelectorComponent } from './theme-selector.component';
import { UserDropdownComponent } from './user-dropdown.component';

@Component({
  selector: 'core-navbar',
  imports: [RouterLink, ThemeSelectorComponent, UserDropdownComponent],
  template: `
    <div class="navbar sticky top-0 bg-base-100 z-10 shadow px-0">
      <div class="flex container px-4 mx-auto">
        <div class="flex-1">
          <a class="btn btn-ghost normal-case text-xl" routerLink="/">
            <div class="inline-flex text-lg md:text-2xl font-mono">
              Chronolog
            </div>
          </a>
        </div>

        <div class="flex items-center gap-2">
          <a class="btn btn-ghost font-normal" routerLink="/time-logs">
            Time Logs
          </a>

          <core-theme-selector />
          <core-user-dropdown />
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {}
