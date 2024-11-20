import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="bg-base-200">
      <router-outlet />
    </div>
  `,
  styles: [],
})
export class AppComponent {}
