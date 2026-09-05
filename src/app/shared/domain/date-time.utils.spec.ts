import { describe, expect, it } from 'vitest';
import {
  getTodayAtTime,
  toLocalDateOnlyString,
  toLocalDateString,
  toLocalTimeString,
} from './date-time.utils';

describe('date-time.utils', () => {
  describe('getTodayAtTime', () => {
    it('keeps today’s date and applies the given time', () => {
      const today = new Date();
      const result = getTodayAtTime(8, 30);

      expect(result.getFullYear()).toBe(today.getFullYear());
      expect(result.getMonth()).toBe(today.getMonth());
      expect(result.getDate()).toBe(today.getDate());
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('rolls over out-of-range values like the Date constructor does', () => {
      const result = getTodayAtTime(24, 0);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(result.getDate()).toBe(tomorrow.getDate());
      expect(result.getHours()).toBe(0);
    });
  });

  describe('toLocalDateOnlyString', () => {
    it('zero-pads single digit months and days', () => {
      expect(toLocalDateOnlyString(new Date(2024, 0, 5))).toBe('2024-01-05');
    });

    it('does not pad two digit months and days', () => {
      expect(toLocalDateOnlyString(new Date(2024, 11, 25))).toBe('2024-12-25');
    });

    it('uses local time, not UTC', () => {
      // 2024-03-10T23:30 local — would be a different day in UTC for most
      // positive offsets, and the previous day for negative ones.
      const date = new Date(2024, 2, 10, 23, 30);
      expect(toLocalDateOnlyString(date)).toBe('2024-03-10');
    });
  });

  describe('toLocalTimeString', () => {
    it('zero-pads hours and minutes', () => {
      expect(toLocalTimeString(new Date(2024, 0, 1, 9, 5))).toBe('09:05');
    });

    it('formats midnight as 00:00', () => {
      expect(toLocalTimeString(new Date(2024, 0, 1, 0, 0))).toBe('00:00');
    });

    it('drops seconds', () => {
      expect(toLocalTimeString(new Date(2024, 0, 1, 13, 45, 59))).toBe('13:45');
    });
  });

  describe('toLocalDateString', () => {
    it('joins date and time with a T, matching datetime-local inputs', () => {
      expect(toLocalDateString(new Date(2024, 6, 4, 7, 8))).toBe(
        '2024-07-04T07:08',
      );
    });
  });
});
