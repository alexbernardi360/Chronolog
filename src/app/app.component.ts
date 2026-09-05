import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToasterComponent } from './shared/components/toaster/toaster.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToasterComponent],
  template: `
    <router-outlet />
    <shared-toaster />
  `,
  styles: [],
})
export class AppComponent {}
