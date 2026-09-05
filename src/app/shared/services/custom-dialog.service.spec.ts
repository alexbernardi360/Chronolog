import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomDialogComponent } from '../dialogs/custom-dialog/custom-dialog.component';
import { CustomDialogService } from './custom-dialog.service';

describe('CustomDialogService', () => {
  const open = vi.fn();
  let service: CustomDialogService;

  beforeEach(() => {
    open.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: Dialog, useValue: { open } }],
    });
    service = TestBed.inject(CustomDialogService);
  });

  it('opens CustomDialogComponent with the given data', async () => {
    open.mockReturnValue({ closed: of(true) });
    const data = { title: 'Alert', message: 'Sure?' };

    await service.show(data);

    expect(open).toHaveBeenCalledWith(
      CustomDialogComponent,
      expect.objectContaining({ data }),
    );
  });

  it('names and describes the dialog for assistive technology', async () => {
    open.mockReturnValue({ closed: of(true) });

    await service.show({ title: 'Alert', message: 'Sure?' });

    expect(open).toHaveBeenCalledWith(
      CustomDialogComponent,
      expect.objectContaining({
        role: 'alertdialog',
        ariaLabelledBy: 'custom-dialog-title',
        ariaDescribedBy: 'custom-dialog-message',
      }),
    );
  });

  it('resolves true when the dialog is confirmed', async () => {
    open.mockReturnValue({ closed: of(true) });

    expect(await service.show({ title: 't', message: 'm' })).toBe(true);
  });

  it('resolves false when the dialog is cancelled', async () => {
    open.mockReturnValue({ closed: of(false) });

    expect(await service.show({ title: 't', message: 'm' })).toBe(false);
  });

  it('resolves false when the dialog is dismissed without a result', async () => {
    open.mockReturnValue({ closed: of(undefined) });

    expect(await service.show({ title: 't', message: 'm' })).toBe(false);
  });
});
