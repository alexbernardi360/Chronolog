import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import {
  MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { toLocalDateString } from '../../../shared/domain/date-time.utils';
import { TimeLog } from '../../../shared/domain/time-log.interface';
import { TimeLogsService } from '../../../shared/services/time-logs.service';
import { TimeLogsFormComponent } from './time-logs-form.component';

const EXISTING: TimeLog = {
  id: 'abc',
  timestamp: '2024-05-01T08:30',
  type: 'exit',
  note: 'Uscita anticipata',
};

describe('TimeLogsFormComponent', () => {
  const getTimeLog = vi.fn();
  const createNewTimeLog = vi.fn();
  const updateNewTimeLog = vi.fn();
  let paramMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let navigateByUrl: MockInstance<Router['navigateByUrl']>;
  let fixture: ComponentFixture<TimeLogsFormComponent>;
  let form: TimeLogsFormComponent;

  /** Renders the component for the given route params (none = "new"). */
  function render(params: Record<string, string> = {}) {
    paramMap = new BehaviorSubject(convertToParamMap(params));

    TestBed.configureTestingModule({
      imports: [TimeLogsFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap } },
        {
          provide: TimeLogsService,
          useValue: { getTimeLog, createNewTimeLog, updateNewTimeLog },
        },
      ],
    });

    navigateByUrl = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);

    fixture = TestBed.createComponent(TimeLogsFormComponent);
    form = fixture.componentInstance;
    fixture.detectChanges();
  }

  const fillValidForm = () => {
    form.timestamp.setValue('2024-05-01T08:30');
    form.type.setValue('entry');
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    getTimeLog.mockReset().mockReturnValue(of(null));
    createNewTimeLog.mockReset().mockReturnValue(of(undefined));
    updateNewTimeLog.mockReset().mockReturnValue(of(undefined));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  describe('create mode', () => {
    it('is new when the route carries no id', () => {
      render();

      expect(form.isNew()).toBe(true);
      expect(getTimeLog).not.toHaveBeenCalled();
    });

    it('preloads the timestamp with now and leaves the type unset', () => {
      render();

      expect(form.timestamp.value).toBe(toLocalDateString(new Date()));
      expect(form.type.value).toBeNull();
      expect(form.formGroup.invalid).toBe(true);
    });

    it('creates the log and returns to the list, replacing history', () => {
      render();
      fillValidForm();

      form.onSubmit();

      expect(createNewTimeLog).toHaveBeenCalledWith({
        timestamp: '2024-05-01T08:30',
        type: 'entry',
        note: null,
      });
      expect(updateNewTimeLog).not.toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/time-logs', {
        replaceUrl: true,
      });
    });
  });

  describe('edit mode', () => {
    it('loads the log named in the route and patches the form', () => {
      getTimeLog.mockReturnValue(of(EXISTING));

      render({ id: 'abc' });

      expect(form.isNew()).toBe(false);
      expect(getTimeLog).toHaveBeenCalledWith('abc');
      expect(form.formGroup.value).toEqual({
        timestamp: EXISTING.timestamp,
        type: EXISTING.type,
        note: EXISTING.note,
      });
    });

    it('keeps the prefilled defaults when the log cannot be loaded', () => {
      getTimeLog.mockReturnValue(of(null));

      render({ id: 'missing' });

      expect(form.timestamp.value).toBe(toLocalDateString(new Date()));
      expect(form.type.value).toBeNull();
    });

    it('updates the existing log, forcing the id from the route', () => {
      getTimeLog.mockReturnValue(of(EXISTING));
      render({ id: 'abc' });

      form.onSubmit();

      expect(updateNewTimeLog).toHaveBeenCalledWith({ ...EXISTING });
      expect(createNewTimeLog).not.toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/time-logs', {
        replaceUrl: true,
      });
    });
  });

  describe('onSubmit', () => {
    it('does nothing while the type is missing', () => {
      render();
      form.timestamp.setValue('2024-05-01T08:30');

      form.onSubmit();

      expect(createNewTimeLog).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('still submits the whole payload even though the form is disabled first', () => {
      render();
      fillValidForm();
      form.formGroup.controls.note.setValue('Nota');

      form.onSubmit();

      expect(createNewTimeLog).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'Nota', type: 'entry' }),
      );
    });

    it('locks the form while the request is in flight', () => {
      render();
      const pending = new Subject<void>();
      createNewTimeLog.mockReturnValue(pending);
      fillValidForm();

      form.onSubmit();

      expect(form.submitting()).toBe(true);
      expect(form.formGroup.disabled).toBe(true);

      pending.next();
      pending.complete();

      expect(form.submitting()).toBe(false);
      expect(form.formGroup.enabled).toBe(true);
    });

    it('stays on the form when the request fails', () => {
      render();
      createNewTimeLog.mockReturnValue(throwError(() => new Error('boom')));
      fillValidForm();

      form.onSubmit();

      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(form.submitting()).toBe(false);
      expect(form.formGroup.enabled).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('follows later route param emissions', () => {
    render();

    paramMap.next(convertToParamMap({ id: 'later' }));

    expect(form.timeLogId()).toBe('later');
    expect(form.isNew()).toBe(false);
  });
});
