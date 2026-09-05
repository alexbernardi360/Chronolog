import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar.component';

@Component({
  imports: [NavbarComponent, RouterOutlet],
  template: `
    <div class="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        class="btn btn-primary btn-sm sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to content
      </a>

      <core-navbar />

      <main
        id="main-content"
        tabindex="-1"
        class="container mx-auto w-full grow p-4"
      >
        <router-outlet />
      </main>
    </div>
  `,
  styles: [],
})
export class MainLayoutComponent {}
