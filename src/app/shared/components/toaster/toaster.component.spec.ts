import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToastService } from '../../services/toast.service';
import { ToasterComponent } from './toaster.component';

describe('ToasterComponent', () => {
  let fixture: ComponentFixture<ToasterComponent>;
  let toasts: ToastService;

  const host = () => fixture.nativeElement as HTMLElement;
  const alerts = () => Array.from(host().querySelectorAll('[role="alert"]'));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ToasterComponent] });
    fixture = TestBed.createComponent(ToasterComponent);
    toasts = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('renders nothing while the queue is empty', () => {
    expect(alerts()).toHaveLength(0);
  });

  it('announces each toast through its own alert role', () => {
    toasts.success('Saved', 0);
    toasts.error('Failed', 0);
    fixture.detectChanges();

    expect(alerts().map((a) => a.textContent!.trim())).toEqual([
      'Saved',
      'Failed',
    ]);
  });

  it('colours the alert from the toast type', () => {
    toasts.warning('Careful', 0);
    fixture.detectChanges();

    expect(alerts()[0].classList.contains('alert-warning')).toBe(true);
    expect(alerts()[0].classList.contains('alert-success')).toBe(false);
  });

  it('gives the dismiss button an accessible name', () => {
    toasts.info('Heads up', 0);
    fixture.detectChanges();

    const button = host().querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Dismiss notification');
  });

  it('dismisses the toast the user closes', () => {
    toasts.info('Heads up', 0);
    fixture.detectChanges();

    host().querySelector('button')!.click();
    fixture.detectChanges();

    expect(alerts()).toHaveLength(0);
    expect(toasts.toasts()).toEqual([]);
  });
});
