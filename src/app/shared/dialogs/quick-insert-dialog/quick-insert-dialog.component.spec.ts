import { DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toLocalDateOnlyString } from '../../domain/date-time.utils';
import { TimeLog } from '../../domain/time-log.interface';
import { TimeLogsService } from '../../services/time-logs.service';
import { QuickInsertDialogComponent } from './quick-insert-dialog.component';

describe('QuickInsertDialogComponent', () => {
  const close = vi.fn();
  const createNewTimeLogs = vi.fn();
  let fixture: ComponentFixture<QuickInsertDialogComponent>;
  let dialog: QuickInsertDialogComponent;

  const inserted = () => createNewTimeLogs.mock.calls[0][0] as TimeLog[];

  beforeEach(() => {
    close.mockReset();
    createNewTimeLogs.mockReset().mockReturnValue(of(undefined));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [QuickInsertDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close } },
        { provide: TimeLogsService, useValue: { createNewTimeLogs } },
      ],
    });
    fixture = TestBed.createComponent(QuickInsertDialogComponent);
    dialog = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  describe('defaults', () => {
    it('preloads today and a standard 8:30–17:30 day', () => {
      expect(dialog.date.value).toBe(toLocalDateOnlyString(new Date()));
      expect(dialog.time1.value).toBe('08:30');
      expect(dialog.time2.value).toBe('13:00');
      expect(dialog.time3.value).toBe('14:00');
      expect(dialog.time4.value).toBe('17:30');
    });

    it('starts valid, so the form can be submitted as-is', () => {
      expect(dialog.formGroup.valid).toBe(true);
      expect(dialog.submitting()).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('inserts the four punches as entry / exit / entry / exit', () => {
      dialog.onSubmit();

      expect(inserted().map((l) => l.type)).toEqual([
        'entry',
        'exit',
        'entry',
        'exit',
      ]);
    });

    it('builds each timestamp from the shared date and its own time', () => {
      dialog.date.setValue('2024-05-01');
      dialog.time1.setValue('09:00');

      dialog.onSubmit();

      expect(inserted().map((l) => l.timestamp)).toEqual([
        '2024-05-01T09:00',
        '2024-05-01T13:00',
        '2024-05-01T14:00',
        '2024-05-01T17:30',
      ]);
    });

    it('copies the note onto every punch', () => {
      dialog.formGroup.controls.note.setValue('Trasferta');

      dialog.onSubmit();

      expect(inserted().map((l) => l.note)).toEqual(Array(4).fill('Trasferta'));
    });

    it('sends a null note when the field is left empty', () => {
      dialog.onSubmit();

      expect(inserted().map((l) => l.note)).toEqual(Array(4).fill(null));
    });

    it('inserts all four punches in a single call', () => {
      dialog.onSubmit();

      expect(createNewTimeLogs).toHaveBeenCalledTimes(1);
      expect(inserted()).toHaveLength(4);
    });

    it('closes with true once the insert succeeds', () => {
      dialog.onSubmit();

      expect(close).toHaveBeenCalledWith(true);
    });

    it('does nothing when a required field is empty', () => {
      dialog.time3.setValue(null);

      dialog.onSubmit();

      expect(createNewTimeLogs).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    });

    it('locks the form while the insert is in flight', () => {
      const pending = new Subject<void>();
      createNewTimeLogs.mockReturnValue(pending);

      dialog.onSubmit();

      expect(dialog.submitting()).toBe(true);
      expect(dialog.formGroup.disabled).toBe(true);

      pending.next();
      pending.complete();

      expect(dialog.submitting()).toBe(false);
      expect(dialog.formGroup.enabled).toBe(true);
    });

    it('re-enables the form and stays open when the insert fails', () => {
      createNewTimeLogs.mockReturnValue(throwError(() => new Error('boom')));

      dialog.onSubmit();

      expect(dialog.submitting()).toBe(false);
      expect(dialog.formGroup.enabled).toBe(true);
      expect(close).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('closes with false on cancel', () => {
    dialog.cancel();

    expect(close).toHaveBeenCalledWith(false);
    expect(createNewTimeLogs).not.toHaveBeenCalled();
  });
});
