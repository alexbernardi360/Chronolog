import { DIALOG_DATA, DialogModule, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
} from '@angular/core';

export interface CustomDialogData {
  title: string;
  message: string;
  confirmButtonType?: 'primary' | 'success' | 'warning' | 'error';
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

@Component({
  imports: [DialogModule],
  templateUrl: './custom-dialog.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomDialogComponent {
  private readonly dialogRef = inject(
    DialogRef<boolean, CustomDialogComponent>,
  );
  private readonly data = inject(DIALOG_DATA);

  get title() {
    return this.data.title;
  }
  get message() {
    return this.data.message;
  }
  get confirmButtonType() {
    return this.data.confirmButtonType ?? 'primary';
  }
  get showCancelButton() {
    return this.data.showCancelButton ?? false;
  }
  get confirmButtonText() {
    return this.data.confirmButtonText ?? 'Confirm';
  }
  get cancelButtonText() {
    return this.data.cancelButtonText ?? 'Cancel';
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
