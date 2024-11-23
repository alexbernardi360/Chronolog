import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimeLog } from '../../../shared/domain/time_log.interface';
import { PagerComponent } from '../../../shared/pager/pager.component';
import { TimeLogsService } from '../../../shared/services/time-logs.service';
import { concatMap } from 'rxjs';

@Component({
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink, PagerComponent],
  templateUrl: './time-logs-grid.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogsGridComponent implements OnInit {
  private timeLogsService = inject(TimeLogsService);

  timeLogs = signal<TimeLog[]>([]);
  totalRows = signal<number | null>(null);
  currentPage = signal<number>(1);
  currentPageSize = signal<number>(10);

  constructor() {
    effect(() =>
      this.timeLogsService
        .getTimeLogs(this.currentPageSize(), this.currentPage())
        .subscribe((timeLogs) => this.timeLogs.set(timeLogs))
    );
  }

  ngOnInit(): void {
    this.timeLogsService
      .getTimeLogsCount()
      .subscribe((count) => this.totalRows.set(count));
  }

  deleteRow(id: string) {
    this.timeLogsService
      .deleteTimeLog(id)
      .pipe(
        concatMap(() =>
          this.timeLogsService.getTimeLogs(
            this.currentPageSize(),
            this.currentPage()
          )
        )
      )
      .subscribe({
        next: (timeLogs) => this.timeLogs.set(timeLogs),
        error: (error) => console.error('Errore:', error),
      });
  }
}
