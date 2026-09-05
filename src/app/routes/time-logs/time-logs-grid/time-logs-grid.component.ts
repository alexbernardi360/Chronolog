import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { EntryTypeBadgeComponent } from '../../../shared/components/entry-type-badge/entry-type-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { QuickInsertDialogComponent } from '../../../shared/dialogs/quick-insert-dialog/quick-insert-dialog.component';
import { CustomDialogService } from '../../../shared/services/custom-dialog.service';
import { TimeLogsService } from '../../../shared/services/time-logs.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Widths for the note skeleton, as percentages. They are fixed rather than
 * random so the placeholder does not twitch on every change detection run.
 */
const SKELETON_NOTE_WIDTHS = [72, 45, 88, 30, 61, 52, 79, 38, 66, 55];

@Component({
  imports: [
    DatePipe,
    RouterLink,
    DialogModule,
    PagerComponent,
    EntryTypeBadgeComponent,
    IconComponent,
  ],
  providers: [DatePipe],
  templateUrl: './time-logs-grid.component.html',
  styles: [],
})
export class TimeLogsGridComponent {
  private readonly timeLogsService = inject(TimeLogsService);
  private readonly dialog = inject(Dialog);
  private readonly customDialogService = inject(CustomDialogService);
  private readonly toasts = inject(ToastService);
  private readonly datePipe = inject(DatePipe);

  readonly currentPage = signal<number>(1);
  readonly currentPageSize = signal<number>(10);

  readonly totalRowsResource = rxResource({
    stream: () => this.timeLogsService.getTimeLogsCount(),
  });

  readonly timeLogsResource = rxResource({
    params: () => ({
      currentPage: this.currentPage(),
      currentPageSize: this.currentPageSize(),
    }),
    stream: ({ params }) =>
      this.timeLogsService.getTimeLogs(
        params.currentPageSize,
        params.currentPage,
      ),
  });

  readonly isEmpty = computed(
    () =>
      !this.timeLogsResource.isLoading() &&
      (this.timeLogsResource.value()?.length ?? 0) === 0,
  );

  readonly loadingRows = computed(() => {
    const total = this.totalRowsResource.value() ?? 0;
    const page = this.currentPage();
    let pageSize = this.currentPageSize();

    const totalPages = Math.ceil(total / pageSize);

    if (page === totalPages) {
      pageSize = total % pageSize || pageSize;
    }

    return Array.from({ length: pageSize }, (_x, i) => ({
      key: i,
      noteWidth: SKELETON_NOTE_WIDTHS[i % SKELETON_NOTE_WIDTHS.length],
    }));
  });

  /** Row actions are icon-only, so each needs a name that says which row. */
  protected editLabel(timestamp: string) {
    return 'Edit the log of ' + this.formatMoment(timestamp);
  }

  protected deleteLabel(timestamp: string) {
    return 'Delete the log of ' + this.formatMoment(timestamp);
  }

  private formatMoment(timestamp: string) {
    return this.datePipe.transform(timestamp, 'dd/MM/yyyy HH:mm') ?? timestamp;
  }

  async deleteRow(id: string) {
    if (
      !(await this.customDialogService.show({
        title: 'Delete time log',
        message:
          'This time log will be removed permanently. Do you want to continue?',
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

    this.timeLogsService.deleteTimeLog(id).subscribe({
      next: () => {
        deleted = true;
        this.totalRowsResource.reload();
        this.timeLogsResource.reload();
        this.toasts.success('Time log deleted.');
      },
      error: (error) => {
        console.error('Errore:', error);
        this.toasts.error('Could not delete the time log.');
      },
      complete: () => {
        if (!deleted) this.toasts.error('Could not delete the time log.');
      },
    });
  }

  openQuickInsertDialog() {
    const dialogRef = this.dialog.open<boolean>(QuickInsertDialogComponent);

    dialogRef.closed.pipe(filter((result) => result === true)).subscribe(() => {
      this.totalRowsResource.reload();
      this.timeLogsResource.reload();
    });
  }
}
