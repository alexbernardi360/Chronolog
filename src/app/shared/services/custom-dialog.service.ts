import { Dialog } from '@angular/cdk/dialog';
import { inject, Service } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import {
  CustomDialogComponent,
  CustomDialogData,
} from '../dialogs/custom-dialog/custom-dialog.component';

/** Ids of the elements CustomDialogComponent names itself with. */
const TITLE_ID = 'custom-dialog-title';
const MESSAGE_ID = 'custom-dialog-message';

@Service()
export class CustomDialogService {
  private readonly dialog = inject(Dialog);

  async show(data: CustomDialogData) {
    return await firstValueFrom(
      this.dialog
        .open<boolean>(CustomDialogComponent, {
          data,
          // Every use is a decision the user has to make before continuing, and
          // the CDK pane — not the inner element — is what carries the role.
          role: 'alertdialog',
          ariaLabelledBy: TITLE_ID,
          ariaDescribedBy: MESSAGE_ID,
        })
        .closed.pipe(map((result) => result === true)),
    );
  }
}
