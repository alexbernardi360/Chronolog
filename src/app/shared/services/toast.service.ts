import { Service, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  readonly id: number;
  readonly type: ToastType;
  readonly message: string;
}

/** How long a toast stays up before it dismisses itself. */
const DEFAULT_DURATION_MS = 4000;

/**
 * Queue of transient messages rendered by `SharedToasterComponent`.
 *
 * Unlike the data services this one never talks to Supabase — it only holds the
 * feedback a caller wants to show after a mutation succeeds or fails.
 */
@Service()
export class ToastService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly queue = signal<readonly Toast[]>([]);

  readonly toasts = this.queue.asReadonly();

  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    return this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration);
  }

  /** A `duration` of `0` keeps the toast up until something dismisses it. */
  show(
    message: string,
    type: ToastType,
    duration = DEFAULT_DURATION_MS,
  ): number {
    const id = this.nextId++;
    this.queue.update((toasts) => [...toasts, { id, type, message }]);

    if (duration > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration),
      );
    }

    return id;
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.queue.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.queue.set([]);
  }
}
