import { Component, computed, input } from '@angular/core';

export type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'delete'
  | 'edit'
  | 'error'
  | 'inbox'
  | 'info'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'menu'
  | 'moon'
  | 'plus'
  | 'success'
  | 'sun'
  | 'warning';

/** Icons drawn with a fill. Every other icon is stroked. */
const FILLED: ReadonlySet<IconName> = new Set<IconName>([
  'chevron-left',
  'chevron-right',
  'delete',
  'edit',
  'moon',
  'sun',
]);

/**
 * Decorative icon. It is always `aria-hidden`, so whatever wraps it — a button,
 * a link — has to carry the accessible name itself.
 *
 * Size comes from the host: `<shared-icon name="edit" class="size-4" />`.
 */
@Component({
  selector: 'shared-icon',
  imports: [],
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      class="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      [attr.fill]="filled() ? 'currentColor' : 'none'"
      [attr.stroke]="filled() ? null : 'currentColor'"
      [attr.stroke-width]="filled() ? null : 2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('chevron-left') {
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        }
        @case ('chevron-right') {
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        }
        @case ('close') {
          <path d="M6 18L18 6M6 6l12 12" />
        }
        @case ('delete') {
          <path
            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
          />
        }
        @case ('edit') {
          <path
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
          />
        }
        @case ('error') {
          <path
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        }
        @case ('inbox') {
          <path
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        }
        @case ('info') {
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
        @case ('lock') {
          <path
            d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
          />
          <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
        }
        @case ('logout') {
          <path
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        }
        @case ('mail') {
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        }
        @case ('menu') {
          <path d="M4 6h16M4 12h16M4 18h16" />
        }
        @case ('moon') {
          <path
            d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
          />
        }
        @case ('plus') {
          <path d="M12 4v16m8-8H4" />
        }
        @case ('success') {
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
        @case ('sun') {
          <path
            d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
          />
        }
        @case ('warning') {
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        }
      }
    </svg>
  `,
  styles: [],
})
export class IconComponent {
  readonly name = input.required<IconName>();

  protected readonly filled = computed(() => FILLED.has(this.name()));
}
