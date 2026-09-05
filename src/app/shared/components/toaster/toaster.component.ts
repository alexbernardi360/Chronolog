import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

/**
 * Renders the `ToastService` queue. Mount it once, in the app shell.
 *
 * Each toast is its own `role="alert"` so assistive technology announces it as
 * it arrives; the container is only a positioning wrapper.
 */
@Component({
  selector: 'shared-toaster',
  imports: [IconComponent],
  template: `
    <div class="toast toast-bottom toast-end z-50 max-w-[calc(100vw-2rem)]">
      @for (toast of toasts(); track toast.id) {
        <div
          role="alert"
          class="alert alert-soft shadow-lg"
          [class.alert-success]="toast.type === 'success'"
          [class.alert-error]="toast.type === 'error'"
          [class.alert-warning]="toast.type === 'warning'"
          [class.alert-info]="toast.type === 'info'"
        >
          <shared-icon [name]="toast.type" class="size-5" />

          <span class="text-sm">{{ toast.message }}</span>

          <button
            type="button"
            class="btn btn-ghost btn-xs btn-circle"
            aria-label="Dismiss notification"
            (click)="dismiss(toast.id)"
          >
            <shared-icon name="close" class="size-3.5" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class ToasterComponent {
  private readonly toastService = inject(ToastService);

  protected readonly toasts = this.toastService.toasts;

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
