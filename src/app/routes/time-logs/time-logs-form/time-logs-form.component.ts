import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { toLocalDateString } from '../../../shared/domain/date-time.utils';
import { EntryType, TimeLog } from '../../../shared/domain/time-log.interface';
import { TimeLogsService } from '../../../shared/services/time-logs.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './time-logs-form.component.html',
  styles: [],
})
export class TimeLogsFormComponent implements OnInit {
  private readonly timeLogsService = inject(TimeLogsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toasts = inject(ToastService);

  timeLogId = signal<string | null>(null);
  isNew = computed(() => this.timeLogId() == null);

  submitting = signal(false);

  readonly formGroup = new FormGroup({
    timestamp: new FormControl<string | null>(toLocalDateString(new Date()), [
      Validators.required,
    ]),
    type: new FormControl<EntryType | null>(null, [Validators.required]),
    note: new FormControl<string | null>(null),
  });

  get timestamp() {
    return this.formGroup.controls.timestamp;
  }
  get type() {
    return this.formGroup.controls.type;
  }

  /** Reactive form controls are not signals, so these re-read on every check. */
  get timestampInvalid() {
    return (
      this.timestamp.invalid && (this.timestamp.dirty || this.timestamp.touched)
    );
  }
  get typeInvalid() {
    return this.type.invalid && (this.type.dirty || this.type.touched);
  }

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      this.timeLogId.set(paramMap.get('id'));
    });

    if (this.timeLogId()) {
      this.timeLogsService
        .getTimeLog(this.timeLogId()!)
        .subscribe((timeLog) => {
          if (timeLog) this.formGroup.patchValue(timeLog);
        });
    }
  }

  onSubmit() {
    if (this.formGroup.invalid) {
      // The submit button stays enabled, so say what is missing.
      this.formGroup.markAllAsTouched();
      return;
    }

    this.formGroup.disable();
    this.submitting.set(true);

    const timeLog = this.formGroup.value as TimeLog;

    const req = this.isNew()
      ? this.timeLogsService.createNewTimeLog(timeLog)
      : this.timeLogsService.updateNewTimeLog({
          ...timeLog,
          id: this.timeLogId()!,
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
            this.isNew() ? 'Time log created.' : 'Time log updated.',
          );
          this.router.navigateByUrl('/time-logs', {
            replaceUrl: true,
          });
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
}
