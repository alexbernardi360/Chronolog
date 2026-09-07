import { Component, computed, input, model } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'shared-pager',
  imports: [IconComponent],
  templateUrl: './pager.component.html',
  styles: [],
})
export class PagerComponent {
  totalRows = input.required<number>();
  pageSize = input.required<number>();
  currentPage = model<number>(1);

  totalPages = computed(() => Math.ceil(this.totalRows() / this.pageSize()));
  pages = computed(() => {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const maxButtons = 7;

    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map(
        (page, index) => ({ key: index, value: page }),
      );
    }

    const pages: (number | null)[] = [];

    // "1, 2, ..."
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push(null);
      pages.push(totalPages);
    }
    // "... 8, 9, 10"
    else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push(null);
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    }
    // "... 4, 5, 6 ..."
    else {
      pages.push(1);
      pages.push(null);
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push(null);
      pages.push(totalPages);
    }

    return pages.map((page, index) => ({ key: index, value: page }));
  });

  isVisible = computed(() => this.totalRows() > 0);
  isPreviousDisabled = computed(() => this.currentPage() === 1);
  isNextDisabled = computed(() => this.currentPage() === this.totalPages());

  /** Digits in the highest page number, which is the widest cell content. */
  private pageDigits = computed(() => String(this.totalPages()).length);

  /**
   * Width shared by every page cell — the numbers and the skipped-page markers
   * alike. The window always holds the same number of cells, so sizing them
   * identically keeps the pager's footprint fixed as the window slides, and the
   * arrows stay put under a pointer clicking through pages.
   *
   * `0.5rem` per digit comfortably clears a digit of the 12px tabular figures
   * `btn-sm` renders, and `1.25rem` covers the `px-2` padding plus the button
   * border. Overshooting is the point: this width, never the content, has to
   * decide how wide a cell is, because a number chip is a bordered `btn` while
   * the marker is a plain span — the moment content wins, the two measure
   * differently and the row resizes. Deliberately not `ch`, which resolves
   * against each element's own font and so differs between the two.
   */
  cellWidth = computed(
    () => `${Math.max(2.25, 0.5 * this.pageDigits() + 1.25)}rem`,
  );

  /** Room the phone readout reserves for the current page, for the same reason. */
  readoutWidth = computed(() => `${0.5 * this.pageDigits()}rem`);

  changePage(page: number | null) {
    if (!page || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  previousPage() {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((current) => current - 1);
  }

  nextPage() {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update((current) => current + 1);
  }
}
