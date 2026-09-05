import { Dialog } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkSummary } from '../../shared/domain/daily-work.interface';
import { QuickInsertDialogComponent } from '../../shared/dialogs/quick-insert-dialog/quick-insert-dialog.component';
import { CustomDialogService } from '../../shared/services/custom-dialog.service';
import { DailyWorksService } from '../../shared/services/daily-works.service';
import { TimeLogsService } from '../../shared/services/time-logs.service';
import { ToastService } from '../../shared/services/toast.service';
import { DailyWorksComponent } from './daily-works.component';

const ROWS: WorkSummary[] = [
  { day: '2024-05-01', total_hours: 8, is_valid: true },
  { day: '2024-05-02', total_hours: 5.5, is_valid: false },
];

describe('DailyWorksComponent', () => {
  const getDailyWorks = vi.fn();
  const getDailyWorksCount = vi.fn();
  const deleteTimeLogsByDate = vi.fn();
  const show = vi.fn();
  const open = vi.fn();
  let fixture: ComponentFixture<DailyWorksComponent>;
  let page: DailyWorksComponent;

  const host = () => fixture.nativeElement as HTMLElement;
  const bodyRows = () => host().querySelectorAll('tbody tr');
  const listRows = () => host().querySelectorAll('ul.list > li');
  const toastMessages = () =>
    TestBed.inject(ToastService)
      .toasts()
      .map((t) => `${t.type}: ${t.message}`);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  /** Builds the component without waiting for its resources to settle. */
  function create() {
    TestBed.configureTestingModule({
      imports: [DailyWorksComponent],
      providers: [
        {
          provide: DailyWorksService,
          useValue: { getDailyWorks, getDailyWorksCount },
        },
        { provide: TimeLogsService, useValue: { deleteTimeLogsByDate } },
        { provide: CustomDialogService, useValue: { show } },
      ],
    });
    // The component imports DialogModule, whose own `Dialog` provider would
    // shadow a root-level stub — override it on the component instead.
    TestBed.overrideComponent(DailyWorksComponent, {
      add: { providers: [{ provide: Dialog, useValue: { open } }] },
    });

    fixture = TestBed.createComponent(DailyWorksComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
  }

  async function render() {
    create();
    await settle();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    getDailyWorks.mockReset().mockReturnValue(of(ROWS));
    getDailyWorksCount.mockReset().mockReturnValue(of(ROWS.length));
    deleteTimeLogsByDate.mockReset().mockReturnValue(of(undefined));
    show.mockReset().mockResolvedValue(false);
    open.mockReset().mockReturnValue({ closed: of(false) });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  describe('loading', () => {
    it('starts on page 1 with 10 rows per page', async () => {
      await render();

      expect(getDailyWorks).toHaveBeenCalledWith(10, 1);
    });

    it('reloads the page when the pager moves, without recounting', async () => {
      await render();

      page.currentPage.set(2);
      await settle();

      expect(getDailyWorks).toHaveBeenLastCalledWith(10, 2);
      expect(getDailyWorksCount).toHaveBeenCalledTimes(1);
    });

    it('renders one row per day with hours and status', async () => {
      await render();

      expect(bodyRows()).toHaveLength(2);
      expect(bodyRows()[0].textContent).toContain('01/05/2024');
      expect(bodyRows()[0].textContent).toContain('8');
      expect(bodyRows()[0].querySelector('.badge')!.textContent!.trim()).toBe(
        'No issues',
      );
    });

    it('flags a day whose hours are not valid', async () => {
      await render();
      const badge = bodyRows()[1].querySelector('.badge')!;

      expect(badge.textContent!.trim()).toBe('Check time logs');
      expect(badge.classList.contains('badge-warning')).toBe(true);
      expect(badge.classList.contains('badge-success')).toBe(false);
    });
  });

  describe('loadingRows', () => {
    it('draws a full page of skeletons on a full page', async () => {
      getDailyWorksCount.mockReturnValue(of(25));
      await render();

      expect(page.loadingRows()).toHaveLength(10);
    });

    it('draws only the remaining skeletons on a partial last page', async () => {
      getDailyWorksCount.mockReturnValue(of(25));
      await render();

      page.currentPage.set(3);

      expect(page.loadingRows()).toHaveLength(5);
    });

    it('draws a full page when the last page is exactly full', async () => {
      getDailyWorksCount.mockReturnValue(of(20));
      await render();

      page.currentPage.set(2);

      expect(page.loadingRows()).toHaveLength(10);
    });

    it('falls back to a full page when the count is unavailable', async () => {
      // The service swallows errors and emits null.
      getDailyWorksCount.mockReturnValue(of(null));
      await render();

      expect(page.loadingRows()).toHaveLength(10);
    });
  });

  describe('deleteRow', () => {
    it('asks for confirmation before deleting a whole day', async () => {
      await render();

      await page.deleteRow('2024-05-01');

      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({
          showCancelButton: true,
          confirmButtonType: 'error',
          confirmButtonText: 'Delete',
        }),
      );
      expect(deleteTimeLogsByDate).not.toHaveBeenCalled();
    });

    it('deletes every log of the day and refreshes when confirmed', async () => {
      show.mockResolvedValue(true);
      await render();

      await page.deleteRow('2024-05-01');
      await settle();

      expect(deleteTimeLogsByDate).toHaveBeenCalledWith('2024-05-01');
      expect(getDailyWorksCount).toHaveBeenCalledTimes(2);
      expect(getDailyWorks).toHaveBeenCalledTimes(2);
    });

    it('does not refresh when the delete fails', async () => {
      show.mockResolvedValue(true);
      deleteTimeLogsByDate.mockReturnValue(throwError(() => new Error('boom')));
      await render();

      await page.deleteRow('2024-05-01');
      await settle();

      expect(getDailyWorks).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });

    it('is wired to the row delete button', async () => {
      await render();

      (bodyRows()[0].querySelector('button') as HTMLButtonElement).click();
      await settle();

      expect(show).toHaveBeenCalled();
    });
  });

  describe('openQuickInsertDialog', () => {
    it('opens the quick insert dialog', async () => {
      await render();

      page.openQuickInsertDialog();

      expect(open).toHaveBeenCalledWith(QuickInsertDialogComponent);
    });

    it('refreshes after a successful quick insert', async () => {
      const closed = new Subject<boolean>();
      open.mockReturnValue({ closed });
      await render();

      page.openQuickInsertDialog();
      closed.next(true);
      await settle();

      expect(getDailyWorksCount).toHaveBeenCalledTimes(2);
      expect(getDailyWorks).toHaveBeenCalledTimes(2);
    });

    it('does not refresh when the dialog is cancelled', async () => {
      const closed = new Subject<boolean>();
      open.mockReturnValue({ closed });
      await render();

      page.openQuickInsertDialog();
      closed.next(false);
      await settle();

      expect(getDailyWorks).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty state', () => {
    it('explains the blank page instead of showing an empty table', async () => {
      getDailyWorks.mockReturnValue(of([]));
      await render();

      expect(page.isEmpty()).toBe(true);
      expect(host().querySelector('table')).toBeNull();
      expect(host().textContent).toContain('No days recorded yet');
    });

    it('is not considered empty while the rows are still loading', () => {
      getDailyWorks.mockReturnValue(new Subject<WorkSummary[]>());
      create();

      expect(page.dailyWorksResource.isLoading()).toBe(true);
      expect(page.isEmpty()).toBe(false);
      expect(host().textContent).not.toContain('No days recorded yet');
    });
  });

  describe('accessibility', () => {
    it('names the delete button after the day it clears', async () => {
      await render();

      expect(
        bodyRows()[0].querySelector('button')!.getAttribute('aria-label'),
      ).toBe('Delete every time log of 01/05/2024');
    });

    it('uses real table headers', async () => {
      await render();
      const headers = Array.from(host().querySelectorAll('thead th'));

      expect(headers).toHaveLength(4);
      expect(headers.every((h) => h.getAttribute('scope') === 'col')).toBe(
        true,
      );
    });

    it('mirrors every row into the phone list', async () => {
      await render();

      expect(listRows()).toHaveLength(ROWS.length);
      expect(listRows()[0].textContent).toContain('01/05/2024');
    });
  });

  describe('feedback', () => {
    it('confirms a delete that went through', async () => {
      show.mockResolvedValue(true);
      await render();

      await page.deleteRow('2024-05-01');
      await settle();

      expect(toastMessages()).toEqual(['success: Day deleted.']);
    });

    it('reports a delete the service swallowed', async () => {
      show.mockResolvedValue(true);
      // The service catches its own errors and completes without emitting.
      deleteTimeLogsByDate.mockReturnValue(of());
      await render();

      await page.deleteRow('2024-05-01');
      await settle();

      expect(toastMessages()).toEqual(['error: Could not delete this day.']);
      expect(getDailyWorks).toHaveBeenCalledTimes(1);
    });
  });
});
