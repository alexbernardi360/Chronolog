import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EntryType } from '../../domain/time_log.interface';

@Component({
  selector: 'shared-entry-type-badge',
  imports: [],
  template: `
    <div
      class="badge badge-soft badge-xs font-mono font-bold uppercase"
      [class.badge-success]="isEntry()"
      [class.badge-error]="isExit()"
    >
      {{ type() }}
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryTypeBadgeComponent {
  type = input.required<EntryType>();

  isEntry = computed(() => this.type() === 'entry');
  isExit = computed(() => this.type() === 'exit');
}
