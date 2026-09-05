import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CustomDialogComponent,
  CustomDialogData,
} from './custom-dialog.component';

describe('CustomDialogComponent', () => {
  const close = vi.fn();
  let fixture: ComponentFixture<CustomDialogComponent>;
  let dialog: CustomDialogComponent;

  function render(data: CustomDialogData) {
    TestBed.configureTestingModule({
      imports: [CustomDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });
    fixture = TestBed.createComponent(CustomDialogComponent);
    dialog = fixture.componentInstance;
    fixture.detectChanges();
  }

  const buttons = () =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );

  beforeEach(() => {
    close.mockReset();
    TestBed.resetTestingModule();
  });

  it('shows the title and message', () => {
    render({ title: 'Alert', message: 'Are you sure?' });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h3')!.textContent).toBe('Alert');
    expect(host.querySelector('p')!.textContent).toBe('Are you sure?');
  });

  it('falls back to a primary confirm button with no cancel', () => {
    render({ title: 't', message: 'm' });

    expect(dialog.confirmButtonType).toBe('primary');
    expect(dialog.showCancelButton).toBe(false);
    expect(dialog.confirmButtonText).toBe('Confirm');
    expect(dialog.cancelButtonText).toBe('Cancel');
    expect(buttons().map((b) => b.textContent!.trim())).toEqual(['Confirm']);
  });

  it('renders the supplied labels and confirm colour', () => {
    render({
      title: 't',
      message: 'm',
      showCancelButton: true,
      confirmButtonType: 'error',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Keep',
    });

    expect(buttons().map((b) => b.textContent!.trim())).toEqual([
      'Keep',
      'Delete',
    ]);
    const confirm = buttons()[1];
    expect(confirm.classList.contains('btn-error')).toBe(true);
    expect(confirm.classList.contains('btn-primary')).toBe(false);
  });

  it('closes with true when confirmed from the template', () => {
    render({ title: 't', message: 'm', showCancelButton: true });

    buttons()[1].click();

    expect(close).toHaveBeenCalledWith(true);
  });

  it('closes with false when cancelled from the template', () => {
    render({ title: 't', message: 'm', showCancelButton: true });

    buttons()[0].click();

    expect(close).toHaveBeenCalledWith(false);
  });
});
