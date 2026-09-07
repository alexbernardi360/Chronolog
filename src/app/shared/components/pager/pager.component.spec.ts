import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PagerComponent } from './pager.component';

describe('PagerComponent', () => {
  let fixture: ComponentFixture<PagerComponent>;
  let pager: PagerComponent;

  /** Sets the required inputs and renders. */
  function setup(totalRows: number, pageSize: number, currentPage = 1) {
    fixture.componentRef.setInput('totalRows', totalRows);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('currentPage', currentPage);
    fixture.detectChanges();
  }

  const pageValues = () => pager.pages().map((p) => p.value);

  const host = () => fixture.nativeElement as HTMLElement;

  /** The numbered pages and the ellipsis placeholders, in document order. */
  const pageCells = () =>
    Array.from(
      host().querySelectorAll<HTMLElement>(
        'ol > li > button[aria-label^="Page "], ol > li > span',
      ),
    );

  const pageButtons = () =>
    Array.from(
      host().querySelectorAll<HTMLButtonElement>('button[aria-label^="Page "]'),
    );

  const renderedLabels = () => pageCells().map((b) => b.textContent!.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PagerComponent] });
    fixture = TestBed.createComponent(PagerComponent);
    pager = fixture.componentInstance;
  });

  describe('totalPages', () => {
    it('rounds a partial last page up', () => {
      setup(21, 10);
      expect(pager.totalPages()).toBe(3);
    });

    it('is exact when rows divide evenly', () => {
      setup(20, 10);
      expect(pager.totalPages()).toBe(2);
    });
  });

  describe('visibility', () => {
    it('hides itself when there are no rows', () => {
      setup(0, 10);

      expect(pager.isVisible()).toBe(false);
      expect(host().querySelector('button')).toBeNull();
    });

    it('shows itself as soon as there is one row', () => {
      setup(1, 10);

      expect(pager.isVisible()).toBe(true);
      expect(renderedLabels()).toEqual(['1']);
    });
  });

  describe('pages', () => {
    it('lists every page without ellipsis up to 7 pages', () => {
      setup(70, 10, 4);

      expect(pageValues()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('keeps the head window while the current page is near the start', () => {
      setup(100, 10, 4);

      expect(pageValues()).toEqual([1, 2, 3, 4, 5, null, 10]);
    });

    it('keeps the tail window while the current page is near the end', () => {
      setup(100, 10, 7);

      expect(pageValues()).toEqual([1, null, 6, 7, 8, 9, 10]);
    });

    it('centres the window around the current page in the middle', () => {
      setup(100, 10, 5);

      expect(pageValues()).toEqual([1, null, 4, 5, 6, null, 10]);
    });

    it('gives every page cell the same width so the row cannot resize', () => {
      setup(100, 10, 5);
      const widths = new Set(pageCells().map((c) => c.style.minWidth));

      expect(widths.size).toBe(1);
    });

    it('keeps the cell count constant while paging, so the arrows stay put', () => {
      setup(100, 10, 1);
      const counts = new Set<number>();

      for (let page = 1; page <= 10; page++) {
        pager.changePage(page);
        fixture.detectChanges();
        counts.add(pageCells().length);
      }

      expect(counts).toEqual(new Set([7]));
    });

    it('holds a minimum cell width when the page numbers are short', () => {
      setup(50, 10, 1);

      expect(pager.cellWidth()).toBe('2.25rem');
    });

    it('reserves room for the widest page number', () => {
      setup(2000, 10, 1);

      expect(pager.cellWidth()).toBe('2.75rem');
      expect(pager.readoutWidth()).toBe('1.5rem');
    });

    it('gives every entry a distinct key so the loop can track duplicates', () => {
      setup(100, 10, 5);
      const keys = pager.pages().map((p) => p.key);

      expect(new Set(keys).size).toBe(keys.length);
    });

    it('renders ellipsis placeholders as inert spans', () => {
      setup(100, 10, 5);

      expect(renderedLabels()).toEqual([
        '1',
        '...',
        '4',
        '5',
        '6',
        '...',
        '10',
      ]);
      const ellipses = pageCells().filter((c) => c.tagName === 'SPAN');
      expect(ellipses).toHaveLength(2);
      expect(pageButtons()).toHaveLength(5);
    });

    it('marks the current page as active', () => {
      setup(50, 10, 3);
      const active = pageButtons().filter((b) =>
        b.classList.contains('btn-primary'),
      );

      expect(active).toHaveLength(1);
      expect(active[0].textContent!.trim()).toBe('3');
    });

    it('leaves every other page in the quiet ghost treatment', () => {
      setup(50, 10, 3);
      const quiet = pageButtons().filter((b) =>
        b.classList.contains('btn-ghost'),
      );

      expect(quiet.map((b) => b.textContent!.trim())).toEqual([
        '1',
        '2',
        '4',
        '5',
      ]);
    });

    it('keeps the ellipsis out of the accessibility tree', () => {
      setup(100, 10, 5);
      const ellipses = pageCells().filter((c) => c.tagName === 'SPAN');

      expect(ellipses.map((e) => e.getAttribute('aria-hidden'))).toEqual([
        'true',
        'true',
      ]);
    });

    it('exposes the current page to assistive technology', () => {
      setup(50, 10, 3);
      const current = pageButtons().filter(
        (b) => b.getAttribute('aria-current') === 'page',
      );

      expect(current).toHaveLength(1);
      expect(current[0].getAttribute('aria-label')).toBe('Page 3');
    });

    it('names every page button', () => {
      setup(50, 10, 1);

      expect(pageButtons().map((b) => b.getAttribute('aria-label'))).toEqual([
        'Page 1',
        'Page 2',
        'Page 3',
        'Page 4',
        'Page 5',
      ]);
    });
  });

  describe('accessibility and small screens', () => {
    it('wraps itself in a labelled navigation landmark', () => {
      setup(100, 10, 1);

      expect(host().querySelector('nav')!.getAttribute('aria-label')).toBe(
        'Pagination',
      );
    });

    it('names the previous and next buttons', () => {
      setup(100, 10, 5);

      expect(
        host().querySelector('button[aria-label="Previous page"]'),
      ).not.toBeNull();
      expect(
        host().querySelector('button[aria-label="Next page"]'),
      ).not.toBeNull();
    });

    it('shows a position readout that replaces the numbers on phones', () => {
      setup(100, 10, 3);

      const readout = host().querySelector('nav > p')!;
      expect(readout.textContent!.replace(/\s+/g, ' ').trim()).toBe('3 / 10');
    });
  });

  describe('changePage', () => {
    it('moves to the requested page', () => {
      setup(100, 10, 1);

      pager.changePage(4);

      expect(pager.currentPage()).toBe(4);
    });

    it('ignores an ellipsis click', () => {
      setup(100, 10, 5);

      pager.changePage(null);

      expect(pager.currentPage()).toBe(5);
    });

    it('ignores pages outside the range', () => {
      setup(100, 10, 5);

      pager.changePage(0);
      pager.changePage(11);
      pager.changePage(-1);

      expect(pager.currentPage()).toBe(5);
    });
  });

  describe('previous / next', () => {
    it('disables previous on the first page', () => {
      setup(100, 10, 1);
      expect(pager.isPreviousDisabled()).toBe(true);
    });

    it('disables next on the last page', () => {
      setup(100, 10, 10);
      expect(pager.isNextDisabled()).toBe(true);
    });

    it('steps backwards and forwards', () => {
      setup(100, 10, 5);

      pager.nextPage();
      expect(pager.currentPage()).toBe(6);

      pager.previousPage();
      expect(pager.currentPage()).toBe(5);
    });

    it('never steps before the first page', () => {
      setup(100, 10, 1);

      pager.previousPage();

      expect(pager.currentPage()).toBe(1);
    });

    it('never steps past the last page', () => {
      setup(100, 10, 10);

      pager.nextPage();

      expect(pager.currentPage()).toBe(10);
    });
  });

  it('writes the page back to the parent through the model input', () => {
    setup(100, 10, 1);
    const seen: number[] = [];
    fixture.componentRef.instance.currentPage.subscribe((p) => seen.push(p));

    pager.nextPage();

    expect(seen).toEqual([2]);
  });
});
