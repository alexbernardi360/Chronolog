import { describe, expect, it } from 'vitest';
import { pageRowSlots } from './pagination.utils';

describe('pagination.utils', () => {
  describe('pageRowSlots', () => {
    it('reserves a full page for every page of a multi-page list', () => {
      // 25 rows over pages of 10 leaves 5 on the last page. The count is the
      // same whichever page you are on, which is the point: the short last
      // page gets padded back up to 10 and the pager cannot move.
      expect(pageRowSlots(25, 10)).toBe(10);
    });

    it('leaves a single-page list at its natural size', () => {
      expect(pageRowSlots(3, 10)).toBe(3);
    });

    it('treats an exactly-full single page as a full page', () => {
      expect(pageRowSlots(10, 10)).toBe(10);
    });

    it('reserves a full page while the count is unknown', () => {
      expect(pageRowSlots(null, 10)).toBe(10);
      expect(pageRowSlots(undefined, 10)).toBe(10);
    });

    it('reserves nothing for an empty list', () => {
      expect(pageRowSlots(0, 10)).toBe(0);
    });

    it('never returns a negative count', () => {
      expect(pageRowSlots(-5, 10)).toBe(0);
    });

    it('reserves nothing when the page size is not positive', () => {
      expect(pageRowSlots(25, 0)).toBe(0);
      expect(pageRowSlots(25, -1)).toBe(0);
    });
  });
});
