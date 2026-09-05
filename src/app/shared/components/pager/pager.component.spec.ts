import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PagerComponent } from './pager.component';

describe('PagerComponent', () => {
  let fixture: ComponentFixture<PagerComponent>;
  let pager: PagerComponent;

  /** Sets the required inputs and returns the rendered page labels. */
  function setup(totalRows: number, pageSize: number, currentPage = 1) {
    fixture.componentRef.setInput('totalRows', totalRows);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('currentPage', currentPage);
    fixture.detectChanges();
  }

  const pageValues = () => pager.pages().map((p) => p.value);

  const host = () => fixture.nativeElement as HTMLElement;

  const pageButtons = () =>
    Array.from(
      host().querySelectorAll<HTMLButtonElement>('.overflow-x-auto button'),
    );

  const renderedLabels = () => pageButtons().map((b) => b.textContent!.trim());

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

    it('gives every entry a distinct key so @for can track duplicates', () => {
      setup(100, 10, 5);
      const keys = pager.pages().map((p) => p.key);

      expect(new Set(keys).size).toBe(keys.length);
    });

    it('renders ellipsis placeholders as disabled buttons', () => {
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
      expect(pageButtons().filter((b) => b.disabled)).toHaveLength(2);
    });

    it('marks the current page button as primary', () => {
      setup(50, 10, 3);
      const active = pageButtons().filter((b) =>
        b.classList.contains('btn-primary'),
      );

      expect(active).toHaveLength(1);
      expect(active[0].textContent!.trim()).toBe('3');
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
