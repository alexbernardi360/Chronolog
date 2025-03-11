import { DialogModule, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
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
import { TimeLog } from '../../domain/time_log.interface';
import { TimeLogsService } from '../../services/time-logs.service';

@Component({
  imports: [DialogModule, ReactiveFormsModule, EntryTypeBadgeComponent],
  templateUrl: './quick-insert-dialog.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickInsertDialogComponent {
  private readonly dialogRef = inject(
    DialogRef<boolean, QuickInsertDialogComponent>,
  );
  private readonly timeLogsService = inject(TimeLogsService);

  readonly submitting = signal(false);

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

  onSubmit(): void {
    if (this.formGroup.invalid) return;

    this.formGroup.disable();
    this.submitting.set(true);

    const timelog1: TimeLog = {
      timestamp: `${this.date.value}T${this.time1.value}`,
      type: 'entry',
      note: this.formGroup.value.note ?? null,
    };
    const timelog2: TimeLog = {
      timestamp: `${this.date.value}T${this.time2.value}`,
      type: 'exit',
      note: this.formGroup.value.note ?? null,
    };
    const timelog3: TimeLog = {
      timestamp: `${this.date.value}T${this.time3.value}`,
      type: 'entry',
      note: this.formGroup.value.note ?? null,
    };
    const timelog4: TimeLog = {
      timestamp: `${this.date.value}T${this.time4.value}`,
      type: 'exit',
      note: this.formGroup.value.note ?? null,
    };

    const req = this.timeLogsService.createNewTimeLogs([
      timelog1,
      timelog2,
      timelog3,
      timelog4,
    ]);

    req
      .pipe(
        finalize(() => {
          this.formGroup.enable();
          this.submitting.set(false);
        }),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error(err),
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
