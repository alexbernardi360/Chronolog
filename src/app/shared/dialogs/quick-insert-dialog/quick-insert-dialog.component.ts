import { DialogModule, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { EntryTypeBadgeComponent } from '../../components/entry-type-badge/entry-type-badge.component';
import {
  getTodayAtTime,
  toLocalDateOnlyString,
  toLocalTimeString,
} from '../../domain/date-time.utils';
import { EntryType, TimeLog } from '../../domain/time-log.interface';
import { TimeLogsService } from '../../services/time-logs.service';
import { ToastService } from '../../services/toast.service';
import { confirmDiscardOnClose } from '../discard-guard';

/** The id the opener has to point `ariaLabelledBy` at. */
export const QUICK_INSERT_DIALOG_TITLE_ID = 'quick-insert-title';

type TimeSlotControl = 'time1' | 'time2' | 'time3' | 'time4';

interface TimeSlot {
  readonly control: TimeSlotControl;
  readonly label: string;
  readonly type: EntryType;
}

@Component({
  imports: [DialogModule, ReactiveFormsModule, EntryTypeBadgeComponent],
  templateUrl: './quick-insert-dialog.component.html',
  styles: [],
})
export class QuickInsertDialogComponent {
  private readonly dialogRef = inject(
    DialogRef<boolean, QuickInsertDialogComponent>,
  );
  private readonly timeLogsService = inject(TimeLogsService);
  private readonly toasts = inject(ToastService);

  protected readonly titleId = QUICK_INSERT_DIALOG_TITLE_ID;

  readonly submitting = signal(false);

  /** The four punches of a standard day, in the order they are written. */
  protected readonly slots: readonly TimeSlot[] = [
    { control: 'time1', label: 'Morning In', type: 'entry' },
    { control: 'time2', label: 'Morning Out', type: 'exit' },
    { control: 'time3', label: 'Afternoon In', type: 'entry' },
    { control: 'time4', label: 'Afternoon Out', type: 'exit' },
  ];

  readonly formGroup = new FormGroup({
    date: new FormControl<string>(toLocalDateOnlyString(new Date()), [
      Validators.required,
    ]),
    time1: new FormControl<string>(toLocalTimeString(getTodayAtTime(8, 30)), [
      Validators.required,
    ]),
    time2: new FormControl<string>(toLocalTimeString(getTodayAtTime(13, 0)), [
      Validators.required,
    ]),
    time3: new FormControl<string>(toLocalTimeString(getTodayAtTime(14, 0)), [
      Validators.required,
    ]),
    time4: new FormControl<string>(toLocalTimeString(getTodayAtTime(17, 30)), [
      Validators.required,
    ]),
    note: new FormControl<string | null>(null),
  });

  constructor() {
    confirmDiscardOnClose({
      isDirty: () => this.formGroup.dirty,
      isSubmitting: () => this.submitting(),
    });
  }

  get date() {
    return this.formGroup.controls.date;
  }
  get time1() {
    return this.formGroup.controls.time1;
  }
  get time2() {
    return this.formGroup.controls.time2;
  }
  get time3() {
    return this.formGroup.controls.time3;
  }
  get time4() {
    return this.formGroup.controls.time4;
  }

  protected get dateInvalid() {
    return this.date.invalid && (this.date.dirty || this.date.touched);
  }

  /** True once the user has had a chance to see the slot is empty. */
  protected slotInvalid(name: TimeSlotControl) {
    const control = this.formGroup.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.formGroup.invalid) {
      // The submit button stays enabled, so say what is missing.
      this.formGroup.markAllAsTouched();
      return;
    }

    this.formGroup.disable();
    this.submitting.set(true);

    const note = this.formGroup.value.note ?? null;
    const timeLogs: TimeLog[] = this.slots.map((slot) => ({
      timestamp: `${this.date.value}T${this.formGroup.controls[slot.control].value}`,
      type: slot.type,
      note,
    }));

    // TimeLogsService swallows failures and completes without emitting, so an
    // empty completion is the only signal that the insert did not happen.
    let inserted = false;

    this.timeLogsService
      .createNewTimeLogs(timeLogs)
      .pipe(
        finalize(() => {
          this.formGroup.enable();
          this.submitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          inserted = true;
          this.toasts.success('Day inserted.');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.toasts.error('Could not insert the day.');
        },
        complete: () => {
          if (!inserted) this.toasts.error('Could not insert the day.');
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
