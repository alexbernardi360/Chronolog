import { Dialog, DialogModule } from '@angular/cdk/dialog';
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
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { QuickInsertDialogComponent } from '../../../shared/dialogs/quick-insert-dialog/quick-insert-dialog.component';
import { TimeLogsService } from '../../../shared/services/time-logs.service';
import { EntryTypeBadgeComponent } from '../../../shared/components/entry-type-badge/entry-type-badge.component';
import { filter } from 'rxjs';

@Component({
  imports: [
    DatePipe,
    NgClass,
    RouterLink,
    DialogModule,
    PagerComponent,
    EntryTypeBadgeComponent,
  ],
  templateUrl: './time-logs-grid.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeLogsGridComponent {
  private timeLogsService = inject(TimeLogsService);
  private dialog = inject(Dialog);

  currentPage = signal<number>(1);
  currentPageSize = signal<number>(10);

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

  deleteRow(id: string) {
    this.timeLogsService.deleteTimeLog(id).subscribe({
      next: () => {
        this.totalRowsResource.reload();
        this.timeLogsResource.reload();
      },
      error: (error) => console.error('Errore:', error),
    });
  }

  getRandomWidth(minWidth: number, maxWidth: number) {
    return Math.random() * (maxWidth - minWidth + 1) + minWidth;
  }

  openQuickInsertDialog() {
    const dialogRef = this.dialog.open<boolean>(QuickInsertDialogComponent);

    dialogRef.closed
      .pipe(filter((result) => result === true))
      .subscribe(() => {
        this.totalRowsResource.reload();
        this.timeLogsResource.reload();
      });
  }
}
