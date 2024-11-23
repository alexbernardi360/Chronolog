import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar.component';

@Component({
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  template: `
    <div class="flex flex-col h-screen">
      <div class="flex-none">
        <core-navbar />
      </div>

      <main class="grow h-full overflow-y-auto p-4 container mx-auto">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {}
