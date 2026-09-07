import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY, Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toLocalDateString } from '../../domain/date-time.utils';
import { TimeLog } from '../../domain/time-log.interface';
import { CustomDialogService } from '../../services/custom-dialog.service';
import { TimeLogsService } from '../../services/time-logs.service';
import { ToastService } from '../../services/toast.service';
import {
  TIME_LOG_DIALOG_TITLE_ID,
  TimeLogDialogComponent,
  TimeLogDialogData,
} from './time-log-dialog.component';

const ROW: TimeLog = {
  id: 'abc',
  created_at: '2024-04-30T10:00:00',
  updated_at: '2024-04-30T10:00:00',
  timestamp: '2024-05-01T08:30:00',
  type: 'entry',
  note: 'mattina',
};

describe('TimeLogDialogComponent', () => {
  const close = vi.fn();
  const createNewTimeLog = vi.fn();
  const updateNewTimeLog = vi.fn();
  const getTimeLog = vi.fn();
  const show = vi.fn();
  let backdropClick: Subject<MouseEvent>;
  let keydownEvents: Subject<KeyboardEvent>;
  let dialogRef: {
    close: typeof close;
    disableClose: boolean;
    backdropClick: Subject<MouseEvent>;
    keydownEvents: Subject<KeyboardEvent>;
  };
  let fixture: ComponentFixture<TimeLogDialogComponent>;
  let dialog: TimeLogDialogComponent;

  const host = () => fixture.nativeElement as HTMLElement;
  const heading = () => host().querySelector('h3')!;
  const saved = () =>
    (createNewTimeLog.mock.calls[0]?.[0] ??
      updateNewTimeLog.mock.calls[0]?.[0]) as TimeLog;
  const toastMessages = () =>
    TestBed.inject(ToastService)
      .toasts()
      .map((t) => `${t.type}: ${t.message}`);

  /** Types into a field the way a user would, so the control turns dirty. */
  const type = (selector: string, value: string) => {
    const field = host().querySelector(selector) as HTMLTextAreaElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const escape = () =>
    keydownEvents.next(new KeyboardEvent('keydown', { key: 'Escape' }));

  function create(data: TimeLogDialogData | null = null) {
    TestBed.resetTestingModule();
    backdropClick = new Subject<MouseEvent>();
    keydownEvents = new Subject<KeyboardEvent>();
    dialogRef = { close, disableClose: false, backdropClick, keydownEvents };

    TestBed.configureTestingModule({
      imports: [TimeLogDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: data },
        {
          provide: TimeLogsService,
          useValue: { createNewTimeLog, updateNewTimeLog, getTimeLog },
        },
        { provide: CustomDialogService, useValue: { show } },
      ],
    });

    fixture = TestBed.createComponent(TimeLogDialogComponent);
    dialog = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    close.mockReset();
    createNewTimeLog.mockReset().mockReturnValue(of(undefined));
    updateNewTimeLog.mockReset().mockReturnValue(of(undefined));
    getTimeLog.mockReset();
    show.mockReset().mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  describe('adding', () => {
    beforeEach(() => create());

    it('starts on the current local moment with no type chosen', () => {
      expect(dialog.timestamp.value).toBe(toLocalDateString(new Date()));
      expect(dialog.type.value).toBeNull();
      expect(dialog.formGroup.controls.note.value).toBeNull();
    });

    it('names itself as the add form', () => {
      expect(heading().textContent!.trim()).toBe('Add New Time Log');
    });

    it('creates the log and closes with true', () => {
      dialog.type.setValue('entry');
      dialog.timestamp.setValue('2024-05-01T08:30');

      dialog.onSubmit();

      expect(saved()).toEqual({
        timestamp: '2024-05-01T08:30',
        type: 'entry',
        note: null,
      });
      expect(updateNewTimeLog).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledWith(true);
      expect(toastMessages()).toEqual(['success: Time log created.']);
    });

    it('does nothing until a type is chosen', () => {
      dialog.onSubmit();

      expect(createNewTimeLog).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
      expect(dialog.type.touched).toBe(true);
    });
  });

  describe('editing', () => {
    beforeEach(() => create({ timeLog: ROW }));

    it('fills the form from the row it was handed, without refetching it', () => {
      expect(dialog.timestamp.value).toBe(ROW.timestamp);
      expect(dialog.type.value).toBe('entry');
      expect(dialog.formGroup.controls.note.value).toBe('mattina');
      expect(getTimeLog).not.toHaveBeenCalled();
    });

    it('names itself as the edit form', () => {
      expect(heading().textContent!.trim()).toBe('Edit Time Log');
    });

    it('updates the log under its own id and closes with true', () => {
      dialog.type.setValue('exit');

      dialog.onSubmit();

      expect(saved()).toEqual({
        id: 'abc',
        timestamp: '2024-05-01T08:30:00',
        type: 'exit',
        note: 'mattina',
      });
      expect(createNewTimeLog).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledWith(true);
      expect(toastMessages()).toEqual(['success: Time log updated.']);
    });
  });

  describe('saving', () => {
    beforeEach(() => {
      create();
      dialog.type.setValue('entry');
    });

    it('locks the form while the save is in flight', () => {
      const pending = new Subject<void>();
      createNewTimeLog.mockReturnValue(pending);

      dialog.onSubmit();

      expect(dialog.submitting()).toBe(true);
      expect(dialog.formGroup.disabled).toBe(true);

      pending.next();
      pending.complete();

      expect(dialog.submitting()).toBe(false);
      expect(dialog.formGroup.enabled).toBe(true);
    });

    it('re-enables the form and stays open when the save fails', () => {
      createNewTimeLog.mockReturnValue(throwError(() => new Error('boom')));

      dialog.onSubmit();

      expect(dialog.submitting()).toBe(false);
      expect(dialog.formGroup.enabled).toBe(true);
      expect(close).not.toHaveBeenCalled();
      expect(toastMessages()).toEqual(['error: Could not save the time log.']);
      expect(console.error).toHaveBeenCalled();
    });

    it('reports a failure when the service completes without saving', () => {
      createNewTimeLog.mockReturnValue(EMPTY);

      dialog.onSubmit();

      expect(close).not.toHaveBeenCalled();
      expect(toastMessages()).toEqual(['error: Could not save the time log.']);
    });
  });

  describe('discarding', () => {
    beforeEach(() => create());

    it('takes closing over from the CDK', () => {
      expect(dialogRef.disableClose).toBe(true);
    });

    it('closes on a backdrop click when nothing was typed', async () => {
      backdropClick.next(new MouseEvent('click'));
      await fixture.whenStable();

      expect(show).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledWith();
    });

    it('asks before dropping typed changes', async () => {
      type('textarea', 'Trasferta');

      backdropClick.next(new MouseEvent('click'));
      await fixture.whenStable();

      expect(show).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledWith();
    });

    it('stays open when the user chooses to keep editing', async () => {
      show.mockResolvedValue(false);
      type('textarea', 'Trasferta');

      backdropClick.next(new MouseEvent('click'));
      await fixture.whenStable();

      expect(close).not.toHaveBeenCalled();
    });

    it('asks on Escape too', async () => {
      type('textarea', 'Trasferta');

      escape();
      await fixture.whenStable();

      expect(show).toHaveBeenCalledTimes(1);
    });

    it('ignores keys other than Escape', async () => {
      type('textarea', 'Trasferta');

      keydownEvents.next(new KeyboardEvent('keydown', { key: 'a' }));
      await fixture.whenStable();

      expect(show).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it('ignores close attempts while the save is in flight', async () => {
      createNewTimeLog.mockReturnValue(new Subject<void>());
      dialog.type.setValue('entry');
      type('textarea', 'Trasferta');
      dialog.onSubmit();

      escape();
      await fixture.whenStable();

      expect(show).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });
  });

  it('closes with false on cancel, without asking', () => {
    create();

    dialog.cancel();

    expect(close).toHaveBeenCalledWith(false);
    expect(show).not.toHaveBeenCalled();
    expect(createNewTimeLog).not.toHaveBeenCalled();
  });

  it('names itself for screen readers with the id its opener points at', () => {
    create();

    expect(heading().id).toBe(TIME_LOG_DIALOG_TITLE_ID);
  });
});
