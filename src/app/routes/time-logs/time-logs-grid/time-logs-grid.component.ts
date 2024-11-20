import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { TimeLogsService } from '../../../shared/services/time-logs.service';
import { RouterLink } from '@angular/router';
import { TimeLog } from '../../../shared/domain/time_log.interface';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './time-logs-grid.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogsGridComponent implements OnInit {
  private timeLogsService = inject(TimeLogsService);

  timeLogs = signal<TimeLog[]>([]);

  ngOnInit(): void {
    this.timeLogsService
      .getTimeLogs()
      .subscribe((timeLogs) => this.timeLogs.set(timeLogs));
  }

  deleteRow(id: string) {
    this.timeLogsService
      .deleteTimeLog(id)
      .subscribe(() =>
        this.timeLogs.update((timeLogs) =>
          timeLogs.filter((timeLog) => timeLog.id !== id)
        )
      );
  }
}
