import { DIALOG_DATA, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { toLocalDateString } from '../../domain/date-time.utils';
import { EntryType, TimeLog } from '../../domain/time-log.interface';
import { TimeLogsService } from '../../services/time-logs.service';
import { ToastService } from '../../services/toast.service';
import { confirmDiscardOnClose } from '../discard-guard';

export interface TimeLogDialogData {
  /** The row to edit. Opening with no data at all means a new log instead. */
  timeLog: TimeLog;
}

/** The id the opener has to point `ariaLabelledBy` at. */
export const TIME_LOG_DIALOG_TITLE_ID = 'time-log-dialog-title';

@Component({
  imports: [DialogModule, ReactiveFormsModule],
  templateUrl: './time-log-dialog.component.html',
  styles: [],
})
export class TimeLogDialogComponent {
  private readonly dialogRef = inject(
    DialogRef<boolean, TimeLogDialogComponent>,
  );
  private readonly data = inject<TimeLogDialogData | null>(DIALOG_DATA);
  private readonly timeLogsService = inject(TimeLogsService);
  private readonly toasts = inject(ToastService);

  protected readonly titleId = TIME_LOG_DIALOG_TITLE_ID;

  /** The grid hands over the row it already holds, so there is nothing to load. */
  private readonly timeLog = this.data?.timeLog ?? null;

  readonly isNew = this.timeLog == null;
  readonly submitting = signal(false);

  readonly formGroup = new FormGroup({
    timestamp: new FormControl<string | null>(
      this.timeLog?.timestamp ?? toLocalDateString(new Date()),
      [Validators.required],
    ),
    type: new FormControl<EntryType | null>(this.timeLog?.type ?? null, [
      Validators.required,
    ]),
    note: new FormControl<string | null>(this.timeLog?.note ?? null),
  });

  constructor() {
    confirmDiscardOnClose({
      isDirty: () => this.formGroup.dirty,
      isSubmitting: () => this.submitting(),
    });
  }

  get timestamp() {
    return this.formGroup.controls.timestamp;
  }
  get type() {
    return this.formGroup.controls.type;
  }

  /** Reactive form controls are not signals, so these re-read on every check. */
  protected get timestampInvalid() {
    return (
      this.timestamp.invalid && (this.timestamp.dirty || this.timestamp.touched)
    );
  }
  protected get typeInvalid() {
    return this.type.invalid && (this.type.dirty || this.type.touched);
  }

  onSubmit(): void {
    if (this.formGroup.invalid) {
      // The submit button stays enabled, so say what is missing.
      this.formGroup.markAllAsTouched();
      return;
    }

    this.formGroup.disable();
    this.submitting.set(true);

    const timeLog = this.formGroup.value as TimeLog;

    const req = this.isNew
      ? this.timeLogsService.createNewTimeLog(timeLog)
      : this.timeLogsService.updateNewTimeLog({
          ...timeLog,
          id: this.timeLog!.id!,
        });

    // TimeLogsService swallows failures and completes without emitting, so an
    // empty completion is the only signal that the save did not happen.
    let saved = false;

    req
      .pipe(
        finalize(() => {
          this.formGroup.enable();
          this.submitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          saved = true;
          this.toasts.success(
            this.isNew ? 'Time log created.' : 'Time log updated.',
          );
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.toasts.error('Could not save the time log.');
        },
        complete: () => {
          if (!saved) this.toasts.error('Could not save the time log.');
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
