import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PagerComponent } from '../../../shared/pager/pager.component';
import { TimeLogsService } from '../../../shared/services/time-logs.service';

@Component({
  imports: [DatePipe, NgClass, RouterLink, PagerComponent],
  templateUrl: './time-logs-grid.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogsGridComponent {
  private timeLogsService = inject(TimeLogsService);

  currentPage = signal<number>(1);
  currentPageSize = signal<number>(10);

  loadingRows = computed(() => {
    const total = this.totalRowsResource.value() ?? 0;
    const page = this.currentPage();
    let pageSize = this.currentPageSize();

    const totalPages = Math.ceil(total / pageSize);

    if (page === totalPages) {
      pageSize = total % pageSize || pageSize;
    }

    return Array(pageSize)
      .fill(0)
      .map((_x, i) => i);
  });

  totalRowsResource = rxResource({
    loader: () => this.timeLogsService.getTimeLogsCount(),
  });

  timeLogsResource = rxResource({
    request: () => ({
      currentPage: this.currentPage(),
      currentPageSize: this.currentPageSize(),
    }),
    loader: (params) =>
      this.timeLogsService.getTimeLogs(
        params.request.currentPageSize,
        params.request.currentPage,
      ),
  });

  deleteRow(id: string) {
    this.timeLogsService.deleteTimeLog(id).subscribe({
      next: () => this.timeLogsResource.reload(),
      error: (error) => console.error('Errore:', error),
    });
  }

  getRandomWidth(minWidth: number, maxWidth: number) {
    return Math.random() * (maxWidth - minWidth + 1) + minWidth;
  }
}
