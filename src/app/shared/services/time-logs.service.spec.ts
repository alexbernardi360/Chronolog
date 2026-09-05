import { firstValueFrom, lastValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryStub, serviceWithClient } from '../../../testing/supabase-stub';
import { TimeLog } from '../domain/time-log.interface';
import { TimeLogsService } from './time-logs.service';

const supabase = { from: vi.fn() };

const ROW: TimeLog = {
  id: 'abc',
  timestamp: '2024-05-01T08:30',
  type: 'entry',
  note: null,
};

describe('TimeLogsService', () => {
  let service: TimeLogsService;

  beforeEach(() => {
    supabase.from.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    service = serviceWithClient(TimeLogsService, supabase);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('getTimeLogs', () => {
    it('queries time_records newest first for the requested page', async () => {
      const stub = queryStub({ data: [ROW], error: null });
      supabase.from.mockReturnValue(stub);

      await firstValueFrom(service.getTimeLogs(10, 3));

      expect(supabase.from).toHaveBeenCalledWith('time_records');
      expect(stub.args('select')).toEqual([
        'id,created_at,updated_at,timestamp,type,note',
      ]);
      expect(stub.args('order')).toEqual(['timestamp', { ascending: false }]);
      // page 3 of 10 → rows 20..29 inclusive
      expect(stub.args('range')).toEqual([20, 29]);
    });

    it('asks for rows 0..pageSize-1 on the first page', async () => {
      const stub = queryStub({ data: [], error: null });
      supabase.from.mockReturnValue(stub);

      await firstValueFrom(service.getTimeLogs(25, 1));

      expect(stub.args('range')).toEqual([0, 24]);
    });

    it('returns the rows', async () => {
      supabase.from.mockReturnValue(queryStub({ data: [ROW], error: null }));

      expect(await firstValueFrom(service.getTimeLogs(10, 1))).toEqual([ROW]);
    });

    it('swallows errors and emits an empty array', async () => {
      supabase.from.mockReturnValue(
        queryStub({ data: null, error: new Error('boom') }),
      );

      expect(await firstValueFrom(service.getTimeLogs(10, 1))).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getTimeLogsCount', () => {
    it('requests an exact head-only count', async () => {
      const stub = queryStub({ count: 42, error: null });
      supabase.from.mockReturnValue(stub);

      expect(await firstValueFrom(service.getTimeLogsCount())).toBe(42);
      expect(stub.args('select')).toEqual([
        '*',
        { count: 'exact', head: true },
      ]);
    });

    it('swallows errors and emits null', async () => {
      supabase.from.mockReturnValue(
        queryStub({ count: null, error: new Error('boom') }),
      );

      expect(await firstValueFrom(service.getTimeLogsCount())).toBeNull();
    });
  });

  describe('getTimeLog', () => {
    it('matches the id lower-cased', async () => {
      const stub = queryStub({ data: [ROW], error: null });
      supabase.from.mockReturnValue(stub);

      expect(await firstValueFrom(service.getTimeLog('ABC'))).toEqual(ROW);
      expect(stub.args('eq')).toEqual(['id', 'abc']);
    });

    it('emits null when no row matches', async () => {
      supabase.from.mockReturnValue(queryStub({ data: [], error: null }));

      expect(await firstValueFrom(service.getTimeLog('abc'))).toBeNull();
    });

    it('swallows errors and emits null', async () => {
      supabase.from.mockReturnValue(
        queryStub({ data: null, error: new Error('boom') }),
      );

      expect(await firstValueFrom(service.getTimeLog('abc'))).toBeNull();
    });
  });

  describe('createNewTimeLog', () => {
    it('inserts a single row as an array', async () => {
      const stub = queryStub({ error: null });
      supabase.from.mockReturnValue(stub);

      await firstValueFrom(service.createNewTimeLog(ROW));

      expect(stub.args('insert')).toEqual([[ROW]]);
    });

    it('inserts every row of a batch in one call', async () => {
      const stub = queryStub({ error: null });
      supabase.from.mockReturnValue(stub);

      await firstValueFrom(service.createNewTimeLogs([ROW, ROW]));

      expect(stub.args('insert')).toEqual([[ROW, ROW]]);
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('swallows errors and completes without emitting', async () => {
      supabase.from.mockReturnValue(queryStub({ error: new Error('boom') }));

      let emitted = false;
      await new Promise<void>((done) =>
        service.createNewTimeLog(ROW).subscribe({
          next: () => (emitted = true),
          complete: done,
        }),
      );

      expect(emitted).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateNewTimeLog', () => {
    it('updates the row matching the log id', async () => {
      const stub = queryStub({ error: null });
      supabase.from.mockReturnValue(stub);

      await firstValueFrom(service.updateNewTimeLog(ROW));

      expect(stub.args('update')).toEqual([ROW]);
      expect(stub.args('eq')).toEqual(['id', 'abc']);
    });
  });

  describe('deleteTimeLog', () => {
    it('deletes by id, unchanged', async () => {
      const stub = queryStub({ error: null });
      supabase.from.mockReturnValue(stub);

      await firstValueFrom(service.deleteTimeLog('ABC'));

      expect(stub.calls.map((c) => c.method)).toEqual(['delete', 'eq']);
      expect(stub.args('eq')).toEqual(['id', 'ABC']);
    });
  });

  describe('deleteTimeLogsByDate', () => {
    it('deletes the half-open range covering the whole day', async () => {
      const stub = queryStub({ error: null });
      supabase.from.mockReturnValue(stub);

      await lastValueFrom(service.deleteTimeLogsByDate('2024-05-01'), {
        defaultValue: undefined,
      });

      expect(stub.args('gte')).toEqual([
        'timestamp',
        '2024-05-01T00:00:00.000',
      ]);
      expect(stub.args('lt')).toEqual(['timestamp', '2024-05-02T00:00:00.000']);
    });

    it('rolls over month ends', async () => {
      const stub = queryStub({ error: null });
      supabase.from.mockReturnValue(stub);

      await lastValueFrom(service.deleteTimeLogsByDate('2024-02-29'), {
        defaultValue: undefined,
      });

      expect(stub.args('lt')).toEqual(['timestamp', '2024-03-01T00:00:00.000']);
    });

    it('rejects a malformed date before hitting the database', () => {
      expect(() => service.deleteTimeLogsByDate('01/05/2024')).toThrow(
        'The date format must be YYYY-MM-DD.',
      );
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('rejects a well-formed but impossible date', () => {
      expect(() => service.deleteTimeLogsByDate('2024-13-45')).toThrow(
        'Invalid date.',
      );
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
