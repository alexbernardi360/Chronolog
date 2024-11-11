import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ThemeSelectorComponent } from './theme-selector.component';
import { UserDropdownComponent } from './user-dropdown.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'core-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ThemeSelectorComponent,
    UserDropdownComponent,
  ],
  template: `
    <div class="navbar bg-base-100">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl" routerLink="/">
          <div class="font-title1 inline-flex text-lg md:text-2xl">
            <pre class="lowercase">Chronolog</pre>
          </div>
        </a>
      </div>

      <div class="flex-none gap-4">
        <core-theme-selector />
        <core-user-dropdown />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {}
