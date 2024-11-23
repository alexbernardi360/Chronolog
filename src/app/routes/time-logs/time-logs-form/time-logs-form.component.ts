import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TimeLog } from '../../../shared/domain/time_log.interface';
import { TimeLogsService } from '../../../shared/services/time-logs.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './time-logs-form.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogsFormComponent implements OnInit {
  private timeLogsService = inject(TimeLogsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  timeLogId = signal<string | null>(null);
  isNew = computed(() => this.timeLogId() == null);

  submitting = signal(false);

  formGroup = new FormGroup({
    timestamp: new FormControl<string | null>(null, [Validators.required]),
    type: new FormControl<'entry' | 'exit' | null>(null, [Validators.required]),
    note: new FormControl<string | null>(null),
  });

  get timestamp() {
    return this.formGroup.controls.timestamp;
  }
  get type() {
    return this.formGroup.controls.type;
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
    if (this.formGroup.invalid) return;

    this.formGroup.disable();
    this.submitting.set(true);

    const timeLog = this.formGroup.value as TimeLog;

    const req = this.isNew()
      ? this.timeLogsService.createNewTimeLog(timeLog)
      : this.timeLogsService.updateNewTimeLog({
          ...timeLog,
          id: this.timeLogId()!,
        });

    req
      .pipe(
        finalize(() => {
          this.formGroup.enable();
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/time-logs', {
            replaceUrl: true,
          });
        },
        error: (err) => console.error(err),
      });
  }
}
