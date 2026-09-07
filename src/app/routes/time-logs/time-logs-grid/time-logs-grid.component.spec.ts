import { Dialog } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickInsertDialogComponent } from '../../../shared/dialogs/quick-insert-dialog/quick-insert-dialog.component';
import { TimeLog } from '../../../shared/domain/time-log.interface';
import { CustomDialogService } from '../../../shared/services/custom-dialog.service';
import { TimeLogsService } from '../../../shared/services/time-logs.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TimeLogsGridComponent } from './time-logs-grid.component';

const ROWS: TimeLog[] = [
  { id: '1', timestamp: '2024-05-01T08:30', type: 'entry', note: 'mattina' },
  { id: '2', timestamp: '2024-05-01T17:30', type: 'exit', note: null },
];

describe('TimeLogsGridComponent', () => {
  const getTimeLogs = vi.fn();
  const getTimeLogsCount = vi.fn();
  const deleteTimeLog = vi.fn();
  const show = vi.fn();
  const open = vi.fn();
  let fixture: ComponentFixture<TimeLogsGridComponent>;
  let grid: TimeLogsGridComponent;

  const host = () => fixture.nativeElement as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const bodyRows = () => host().querySelectorAll('tbody tr');
  const listRows = () => host().querySelectorAll('ul.list > li');
  const toastMessages = () =>
    TestBed.inject(ToastService)
      .toasts()
      .map((t) => `${t.type}: ${t.message}`);

  /** Builds the component without waiting for its resources to settle. */
  function create() {
    TestBed.configureTestingModule({
      imports: [TimeLogsGridComponent],
      providers: [
        provideRouter([]),
        {
          provide: TimeLogsService,
          useValue: { getTimeLogs, getTimeLogsCount, deleteTimeLog },
        },
        { provide: CustomDialogService, useValue: { show } },
      ],
    });
    // The component imports DialogModule, whose own `Dialog` provider would
    // shadow a root-level stub — override it on the component instead.
    TestBed.overrideComponent(TimeLogsGridComponent, {
      add: { providers: [{ provide: Dialog, useValue: { open } }] },
    });

    fixture = TestBed.createComponent(TimeLogsGridComponent);
    grid = fixture.componentInstance;
    fixture.detectChanges();
  }

  async function render() {
    create();
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    getTimeLogs.mockReset().mockReturnValue(of(ROWS));
    getTimeLogsCount.mockReset().mockReturnValue(of(ROWS.length));
    deleteTimeLog.mockReset().mockReturnValue(of(undefined));
    show.mockReset().mockResolvedValue(false);
    open.mockReset().mockReturnValue({ closed: of(false) });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  describe('loading', () => {
    it('starts on page 1 with 10 rows per page', async () => {
      await render();

      expect(getTimeLogs).toHaveBeenCalledWith(10, 1);
    });

    it('reloads the page when the pager moves', async () => {
      await render();

      grid.currentPage.set(2);
      await settle();

      expect(getTimeLogs).toHaveBeenLastCalledWith(10, 2);
      expect(getTimeLogsCount).toHaveBeenCalledTimes(1);
    });

    it('renders one row per log', async () => {
      await render();

      expect(bodyRows()).toHaveLength(2);
      expect(bodyRows()[0].textContent).toContain('01/05/2024');
      expect(bodyRows()[0].textContent).toContain('mattina');
      expect(bodyRows()[0].querySelector('.badge')!.textContent!.trim()).toBe(
        'entry',
      );
    });

    it('renders nothing but the header when the query fails and returns []', async () => {
      getTimeLogs.mockReturnValue(of([]));
      await render();

      expect(bodyRows()).toHaveLength(0);
    });
  });

  describe('loadingRows', () => {
    it('draws a full page of skeletons on a full page', async () => {
      getTimeLogsCount.mockReturnValue(of(25));
      await render();

      expect(grid.loadingRows()).toHaveLength(10);
    });

    it('keeps a full page of skeletons on a partial last page', async () => {
      getTimeLogsCount.mockReturnValue(of(25));
      await render();

      grid.currentPage.set(3);

      // The short page is padded back up to a full one, so the skeletons have
      // to fill the same slots or loading would shift the layout.
      expect(grid.loadingRows()).toHaveLength(10);
    });

    it('draws a full page when the last page is exactly full', async () => {
      getTimeLogsCount.mockReturnValue(of(20));
      await render();

      grid.currentPage.set(2);

      expect(grid.loadingRows()).toHaveLength(10);
    });

    it('falls back to a full page when the count is unavailable', async () => {
      // The service swallows errors and emits null.
      getTimeLogsCount.mockReturnValue(of(null));
      await render();

      expect(grid.loadingRows()).toHaveLength(10);
    });
  });

  describe('fillerRows', () => {
    it('pads a short last page up to a full one', async () => {
      // 25 rows over pages of 10, and the service hands back the two stubs.
      getTimeLogsCount.mockReturnValue(of(25));
      await render();

      expect(grid.fillerRows()).toHaveLength(10 - ROWS.length);
    });

    it('leaves a single-page list unpadded', async () => {
      // The default count is ROWS.length, so it all fits on one page: there is
      // nowhere to page to, so the card may be as short as its content.
      await render();

      expect(grid.fillerRows()).toHaveLength(0);
    });

    it('renders the padding as inert rows hidden from assistive technology', async () => {
      getTimeLogsCount.mockReturnValue(of(25));
      await render();
      const fillers = Array.from(bodyRows()).filter(
        (r) => r.getAttribute('aria-hidden') === 'true',
      );

      expect(bodyRows()).toHaveLength(10);
      expect(fillers).toHaveLength(10 - ROWS.length);
      expect(fillers.every((r) => r.querySelector('a, button') === null)).toBe(
        true,
      );
    });
  });

  describe('deleteRow', () => {
    it('asks for confirmation before deleting', async () => {
      await render();

      await grid.deleteRow('1');

      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({
          showCancelButton: true,
          confirmButtonType: 'error',
          confirmButtonText: 'Delete',
        }),
      );
    });

    it('does not delete when the user cancels', async () => {
      show.mockResolvedValue(false);
      await render();

      await grid.deleteRow('1');

      expect(deleteTimeLog).not.toHaveBeenCalled();
    });

    it('deletes and refreshes both rows and count when confirmed', async () => {
      show.mockResolvedValue(true);
      await render();

      await grid.deleteRow('1');
      await settle();

      expect(deleteTimeLog).toHaveBeenCalledWith('1');
      expect(getTimeLogsCount).toHaveBeenCalledTimes(2);
      expect(getTimeLogs).toHaveBeenCalledTimes(2);
    });

    it('does not refresh when the delete fails', async () => {
      show.mockResolvedValue(true);
      deleteTimeLog.mockReturnValue(throwError(() => new Error('boom')));
      await render();

      await grid.deleteRow('1');
      await settle();

      expect(getTimeLogs).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });

    it('is wired to the row delete button', async () => {
      show.mockResolvedValue(false);
      await render();

      const button = bodyRows()[0].querySelector('button') as HTMLButtonElement;
      button.click();
      await settle();

      expect(show).toHaveBeenCalled();
    });
  });

  describe('openQuickInsertDialog', () => {
    it('opens the quick insert dialog', async () => {
      await render();

      grid.openQuickInsertDialog();

      expect(open).toHaveBeenCalledWith(QuickInsertDialogComponent);
    });

    it('refreshes after a successful quick insert', async () => {
      const closed = new Subject<boolean>();
      open.mockReturnValue({ closed });
      await render();

      grid.openQuickInsertDialog();
      closed.next(true);
      await settle();

      expect(getTimeLogsCount).toHaveBeenCalledTimes(2);
      expect(getTimeLogs).toHaveBeenCalledTimes(2);
    });

    it('does not refresh when the dialog is cancelled', async () => {
      const closed = new Subject<boolean>();
      open.mockReturnValue({ closed });
      await render();

      grid.openQuickInsertDialog();
      closed.next(false);
      await settle();

      expect(getTimeLogs).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty state', () => {
    it('offers a way forward instead of an empty table', async () => {
      getTimeLogs.mockReturnValue(of([]));
      await render();

      expect(grid.isEmpty()).toBe(true);
      expect(host().querySelector('table')).toBeNull();
      expect(host().textContent).toContain('No time logs yet');
    });

    it('is not considered empty while the rows are still loading', () => {
      // A resource that never resolves: the placeholder must not flash.
      getTimeLogs.mockReturnValue(new Subject<TimeLog[]>());
      create();

      expect(grid.timeLogsResource.isLoading()).toBe(true);
      expect(grid.isEmpty()).toBe(false);
      expect(host().textContent).not.toContain('No time logs yet');
    });
  });

  describe('columns', () => {
    it('shows the update time in Updated at, not the creation time', async () => {
      getTimeLogs.mockReturnValue(
        of([
          {
            ...ROWS[0],
            created_at: '2024-05-01T09:00',
            updated_at: '2024-06-02T10:15',
          },
        ]),
      );
      await render();

      const cells = bodyRows()[0].querySelectorAll('td');
      expect(cells[3].textContent).toContain('01/05/2024');
      expect(cells[4].textContent).toContain('02/06/2024');
    });

    it('mirrors every row into the phone list', async () => {
      await render();

      expect(listRows()).toHaveLength(ROWS.length);
      expect(listRows()[0].textContent).toContain('08:30');
    });
  });

  describe('skeletons', () => {
    it('keeps the placeholder widths stable between checks', async () => {
      getTimeLogsCount.mockReturnValue(of(25));
      await render();

      const first = grid.loadingRows();
      fixture.detectChanges();

      // Recomputing new random widths on every check made them flicker.
      expect(grid.loadingRows()).toBe(first);
      expect(first.map((r) => r.noteWidth)).toEqual(
        grid.loadingRows().map((r) => r.noteWidth),
      );
    });
  });

  describe('accessibility', () => {
    it('names each row action after the row it acts on', async () => {
      await render();
      const row = bodyRows()[0];

      expect(row.querySelector('a')!.getAttribute('aria-label')).toBe(
        'Edit the log of 01/05/2024 08:30',
      );
      expect(row.querySelector('button')!.getAttribute('aria-label')).toBe(
        'Delete the log of 01/05/2024 08:30',
      );
    });

    it('uses real table headers', async () => {
      await render();
      const headers = Array.from(host().querySelectorAll('thead th'));

      expect(headers).toHaveLength(7);
      expect(headers.every((h) => h.getAttribute('scope') === 'col')).toBe(
        true,
      );
    });
  });

  describe('feedback', () => {
    it('confirms a delete that went through', async () => {
      show.mockResolvedValue(true);
      await render();

      await grid.deleteRow('1');
      await settle();

      expect(toastMessages()).toEqual(['success: Time log deleted.']);
    });

    it('reports a delete the service swallowed', async () => {
      show.mockResolvedValue(true);
      // The service catches its own errors and completes without emitting.
      deleteTimeLog.mockReturnValue(of());
      await render();

      await grid.deleteRow('1');
      await settle();

      expect(toastMessages()).toEqual([
        'error: Could not delete the time log.',
      ]);
      expect(getTimeLogs).toHaveBeenCalledTimes(1);
    });

    it('says nothing when the user cancels', async () => {
      show.mockResolvedValue(false);
      await render();

      await grid.deleteRow('1');
      await settle();

      expect(toastMessages()).toEqual([]);
    });
  });
});
