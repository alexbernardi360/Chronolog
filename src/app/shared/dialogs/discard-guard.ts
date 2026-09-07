import { DialogRef } from '@angular/cdk/dialog';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, merge } from 'rxjs';
import { CustomDialogService } from '../services/custom-dialog.service';

export interface DiscardGuardOptions {
  /** Whether the user has typed anything that closing would throw away. */
  isDirty: () => boolean;
  /** Whether a save is in flight — close requests are ignored while it is. */
  isSubmitting: () => boolean;
}

/**
 * Defends a form dialog against the two ways of closing it by accident: a click
 * on the backdrop and the Escape key. Call it from the dialog's constructor;
 * an explicit Cancel button is a deliberate discard and does not go through it.
 */
export function confirmDiscardOnClose({
  isDirty,
  isSubmitting,
}: DiscardGuardOptions): void {
  const dialogRef = inject(DialogRef);
  const customDialogService = inject(CustomDialogService);

  // The CDK closes on both events before the form gets a say, so take them over.
  dialogRef.disableClose = true;

  merge(
    dialogRef.backdropClick,
    dialogRef.keydownEvents.pipe(filter((event) => event.key === 'Escape')),
  )
    .pipe(takeUntilDestroyed())
    .subscribe(async () => {
      if (isSubmitting()) return;

      if (
        isDirty() &&
        !(await customDialogService.show({
          title: 'Discard changes',
          message:
            'The changes you made have not been saved. Do you want to discard them?',
          showCancelButton: true,
          confirmButtonType: 'warning',
          confirmButtonText: 'Discard',
          cancelButtonText: 'Keep editing',
        }))
      )
        return;

      // Closes with no result: only an actual save reports `true` to the caller.
      dialogRef.close();
    });
}
