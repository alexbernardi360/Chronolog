import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  template: `
    <div class="hero min-h-[60vh]">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <p class="text-primary font-mono text-6xl font-bold">404</p>

          <h1 class="mt-4 text-3xl font-bold sm:text-5xl">Page not found</h1>

          <p class="py-6 opacity-70">
            We looked everywhere for this page. Are you sure the website URL is
            correct?
          </p>

          <a class="btn btn-primary" routerLink="/">Back to home</a>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class NotFoundComponent {}
