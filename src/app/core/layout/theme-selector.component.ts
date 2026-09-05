import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { getTheme, setTheme } from '../../shared/domain/common.utils';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Theme = 'light' | 'dark';

@Component({
  selector: 'core-theme-selector',
  imports: [IconComponent],
  template: `
    <label
      class="swap swap-rotate btn btn-ghost btn-circle"
      [title]="actionLabel()"
    >
      <!-- This hidden checkbox controls the state. -->
      <input
        type="checkbox"
        [checked]="theme() === 'light'"
        [attr.aria-label]="actionLabel()"
        (change)="toggleTheme()"
      />

      <shared-icon name="sun" class="swap-on size-6" />
      <shared-icon name="moon" class="swap-off size-6" />
    </label>
  `,
  styles: [],
})
export class ThemeSelectorComponent implements OnInit {
  private readonly meta = inject(Meta);

  readonly theme = signal<Theme>(getTheme());

  protected readonly actionLabel = computed(() =>
    this.theme() === 'light' ? 'Switch to dark theme' : 'Switch to light theme',
  );

  ngOnInit() {
    this.applyTheme(this.theme());
  }

  toggleTheme() {
    this.theme.update((theme) => (theme === 'light' ? 'dark' : 'light'));
    this.applyTheme(this.theme());
  }

  private applyTheme(theme: Theme) {
    // Aggiorna data-theme su <html> per daisyUI
    document.documentElement.setAttribute('data-theme', theme);

    // Salva tema in localStorage
    setTheme(theme);

    // Aggiorna meta tag theme-color. daisyUI 5 espone il colore completo in
    // --color-base-100 (v4 usava --b1 con i soli componenti), quindi va usato
    // così com'è senza riavvolgerlo in oklch().
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-base-100')
      .trim();

    if (color) this.meta.updateTag({ name: 'theme-color', content: color });
  }
}
