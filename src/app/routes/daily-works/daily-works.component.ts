import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, map } from 'rxjs';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { QuickInsertDialogComponent } from '../../shared/dialogs/quick-insert-dialog/quick-insert-dialog.component';
import { DailyWorksService } from '../../shared/services/daily-works.service';
import { TimeLogsService } from '../../shared/services/time-logs.service';
import { CustomDialogComponent } from '../../shared/dialogs/custom-dialog/custom-dialog.component';
import { CustomDialogService } from '../../shared/services/custom-dialog.service';

@Component({
  imports: [DatePipe, DialogModule, PagerComponent],
  templateUrl: './daily-works.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyWorksComponent {
  private readonly dailyWorksService = inject(DailyWorksService);
  private readonly timeLogsService = inject(TimeLogsService);
  private readonly dialog = inject(Dialog);
  private readonly customDialogService = inject(CustomDialogService);

  readonly currentPage = signal<number>(1);
  readonly currentPageSize = signal<number>(10);

  readonly totalRowsResource = rxResource({
    loader: () => this.dailyWorksService.getDailyWorksCount(),
  });

  readonly dailyWorksResource = rxResource({
    request: () => ({
      currentPage: this.currentPage(),
      currentPageSize: this.currentPageSize(),
    }),
    loader: (params) =>
      this.dailyWorksService.getDailyWorks(
        params.request.currentPageSize,
        params.request.currentPage,
      ),
  });

  readonly loadingRows = computed(() => {
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

  openQuickInsertDialog() {
    const dialogRef = this.dialog.open<boolean>(QuickInsertDialogComponent);

    dialogRef.closed.pipe(filter((result) => result === true)).subscribe(() => {
      this.totalRowsResource.reload();
      this.dailyWorksResource.reload();
    });
  }

  async deleteRow(day: string) {
    if (
      await this.customDialogService.show({
        title: 'Alert',
        message: 'Are you sure you want to delete this row?',
        showCancelButton: true,
        confirmButtonType: 'error',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      })
    )
      this.timeLogsService.deleteTimeLogsByDate(day).subscribe({
        next: () => {
          this.totalRowsResource.reload();
          this.dailyWorksResource.reload();
        },
        error: (error) => console.error('Errore:', error),
      });
  }
}
