import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { EntryTypeBadgeComponent } from '../../../shared/components/entry-type-badge/entry-type-badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import {
  QUICK_INSERT_DIALOG_TITLE_ID,
  QuickInsertDialogComponent,
} from '../../../shared/dialogs/quick-insert-dialog/quick-insert-dialog.component';
import {
  TIME_LOG_DIALOG_TITLE_ID,
  TimeLogDialogComponent,
} from '../../../shared/dialogs/time-log-dialog/time-log-dialog.component';
import { pageRowSlots } from '../../../shared/domain/pagination.utils';
import { TimeLog } from '../../../shared/domain/time-log.interface';
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

  /** Row slots every page occupies, short last page included. */
  readonly rowSlots = computed(() =>
    pageRowSlots(this.totalRowsResource.value(), this.currentPageSize()),
  );

  readonly loadingRows = computed(() =>
    Array.from({ length: this.rowSlots() }, (_x, i) => ({
      key: i,
      noteWidth: SKELETON_NOTE_WIDTHS[i % SKELETON_NOTE_WIDTHS.length],
    })),
  );

  /**
   * Blank rows padding a short last page up to a full one, so the pager below
   * the table stays where it was on every other page. Clamped at zero in case a
   * page comes back longer than the count promised.
   */
  readonly fillerRows = computed(() => {
    const loaded = this.timeLogsResource.value()?.length ?? 0;

    return Array.from(
      { length: Math.max(0, this.rowSlots() - loaded) },
      (_x, i) => i,
    );
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
    this.reloadWhenSaved(
      this.dialog.open<boolean>(QuickInsertDialogComponent, {
        ariaLabelledBy: QUICK_INSERT_DIALOG_TITLE_ID,
      }),
    );
  }

  /** Without a row it adds a new log; with one it edits that row. */
  openTimeLogDialog(timeLog?: TimeLog) {
    this.reloadWhenSaved(
      this.dialog.open<boolean>(TimeLogDialogComponent, {
        data: timeLog ? { timeLog } : null,
        ariaLabelledBy: TIME_LOG_DIALOG_TITLE_ID,
      }),
    );
  }

  /**
   * Refreshes the page in place once a dialog reports a save. Anything else it
   * closes with — cancelled, dismissed — leaves the grid alone.
   */
  private reloadWhenSaved(dialogRef: DialogRef<boolean>) {
    dialogRef.closed.pipe(filter((result) => result === true)).subscribe(() => {
      this.totalRowsResource.reload();
      this.timeLogsResource.reload();
    });
  }
}
