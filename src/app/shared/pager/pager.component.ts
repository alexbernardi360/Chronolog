import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'shared-pager',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    @if (isVisible()) {
    <div class="flex justify-center mt-4 gap-1">
      <!-- Previous Button -->
      <button
        class="btn btn-sm btn-outline btn-primary"
        [disabled]="isPreviousDisabled()"
        (click)="previousPage()"
      >
        « Previous
      </button>

      <!-- Page Numbers -->
      <div class="flex gap-1 overflow-x-auto">
        @for(page of pages(); track page.key) {
        <button
          class="btn btn-sm"
          [ngClass]="{
            'btn-primary': page.value === currentPage(),
            'btn-disabled': page.value === null,
          }"
          [disabled]="page.value === null"
          (click)="page.value !== null && changePage(page.value)"
        >
          {{ page.value || '...' }}
        </button>
        }
      </div>

      <!-- Next Button -->
      <button
        class="btn btn-sm btn-outline btn-primary"
        [disabled]="isNextDisabled()"
        (click)="nextPage()"
      >
        Next »
      </button>
    </div>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        (page, index) => ({ key: index, value: page })
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

  changePage(page: number | null) {
    if (!page || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  previousPage() {
    if (this.currentPage() <= 0) return;
    this.currentPage.update((current) => current - 1);
  }

  nextPage() {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update((current) => current + 1);
  }
}
