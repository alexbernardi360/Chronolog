import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryStub, serviceWithClient } from '../../../testing/supabase-stub';
import { WorkSummary } from '../domain/daily-work.interface';
import { DailyWorksService } from './daily-works.service';

const supabase = { from: vi.fn() };

const ROW: WorkSummary = {
  day: '2024-05-01',
  total_hours: 8,
  is_valid: true,
};

describe('DailyWorksService', () => {
  let service: DailyWorksService;

  beforeEach(() => {
    supabase.from.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    service = serviceWithClient(DailyWorksService, supabase);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('getDailyWorks', () => {
    it('queries daily_works newest day first for the requested page', async () => {
      const stub = queryStub({ data: [ROW], error: null });
      supabase.from.mockReturnValue(stub);

      expect(await firstValueFrom(service.getDailyWorks(10, 2))).toEqual([ROW]);
      expect(supabase.from).toHaveBeenCalledWith('daily_works');
      expect(stub.args('select')).toEqual(['day,total_hours,is_valid']);
      expect(stub.args('order')).toEqual(['day', { ascending: false }]);
      // page 2 of 10 → rows 10..19 inclusive
      expect(stub.args('range')).toEqual([10, 19]);
    });

    it('asks for rows 0..pageSize-1 on the first page', async () => {
      const stub = queryStub({ data: [], error: null });
      supabase.from.mockReturnValue(stub);

      await firstValueFrom(service.getDailyWorks(5, 1));

      expect(stub.args('range')).toEqual([0, 4]);
    });

    it('swallows errors and emits an empty array', async () => {
      supabase.from.mockReturnValue(
        queryStub({ data: null, error: new Error('boom') }),
      );

      expect(await firstValueFrom(service.getDailyWorks(10, 1))).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getDailyWorksCount', () => {
    it('requests an exact head-only count', async () => {
      const stub = queryStub({ count: 7, error: null });
      supabase.from.mockReturnValue(stub);

      expect(await firstValueFrom(service.getDailyWorksCount())).toBe(7);
      expect(stub.args('select')).toEqual([
        '*',
        { count: 'exact', head: true },
      ]);
    });

    it('swallows errors and emits null', async () => {
      supabase.from.mockReturnValue(
        queryStub({ count: null, error: new Error('boom') }),
      );

      expect(await firstValueFrom(service.getDailyWorksCount())).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
