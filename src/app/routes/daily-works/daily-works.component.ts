import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { QuickInsertDialogComponent } from '../../shared/dialogs/quick-insert-dialog/quick-insert-dialog.component';
import { CustomDialogService } from '../../shared/services/custom-dialog.service';
import { DailyWorksService } from '../../shared/services/daily-works.service';
import { TimeLogsService } from '../../shared/services/time-logs.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  imports: [DatePipe, DialogModule, PagerComponent, IconComponent],
  providers: [DatePipe],
  templateUrl: './daily-works.component.html',
  styles: [],
})
export class DailyWorksComponent {
  private readonly dailyWorksService = inject(DailyWorksService);
  private readonly timeLogsService = inject(TimeLogsService);
  private readonly dialog = inject(Dialog);
  private readonly customDialogService = inject(CustomDialogService);
  private readonly toasts = inject(ToastService);
  private readonly datePipe = inject(DatePipe);

  readonly currentPage = signal<number>(1);
  readonly currentPageSize = signal<number>(10);

  readonly totalRowsResource = rxResource({
    stream: () => this.dailyWorksService.getDailyWorksCount(),
  });

  readonly dailyWorksResource = rxResource({
    params: () => ({
      currentPage: this.currentPage(),
      currentPageSize: this.currentPageSize(),
    }),
    stream: ({ params }) =>
      this.dailyWorksService.getDailyWorks(
        params.currentPageSize,
        params.currentPage,
      ),
  });

  readonly isEmpty = computed(
    () =>
      !this.dailyWorksResource.isLoading() &&
      (this.dailyWorksResource.value()?.length ?? 0) === 0,
  );

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

  /** The delete button is icon-only, so it needs a name that says which day. */
  protected deleteLabel(day: string) {
    return (
      'Delete every time log of ' +
      (this.datePipe.transform(day, 'dd/MM/yyyy') ?? day)
    );
  }

  openQuickInsertDialog() {
    const dialogRef = this.dialog.open<boolean>(QuickInsertDialogComponent);

    dialogRef.closed.pipe(filter((result) => result === true)).subscribe(() => {
      this.totalRowsResource.reload();
      this.dailyWorksResource.reload();
    });
  }

  async deleteRow(day: string) {
    if (
      !(await this.customDialogService.show({
        title: 'Delete day',
        message:
          'Every time log of this day will be removed permanently. Do you want to continue?',
        showCancelButton: true,
        confirmButtonType: 'error',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      }))
    )
      return;

    // TimeLogsService swallows failures and completes without emitting, so an
    // empty completion is the only signal that the delete did not happen.
    let deleted = false;

    this.timeLogsService.deleteTimeLogsByDate(day).subscribe({
      next: () => {
        deleted = true;
        this.totalRowsResource.reload();
        this.dailyWorksResource.reload();
        this.toasts.success('Day deleted.');
      },
      error: (error) => {
        console.error('Errore:', error);
        this.toasts.error('Could not delete this day.');
      },
      complete: () => {
        if (!deleted) this.toasts.error('Could not delete this day.');
      },
    });
  }
}
