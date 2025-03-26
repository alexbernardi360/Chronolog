import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import {
  CustomDialogComponent,
  CustomDialogData,
} from '../dialogs/custom-dialog/custom-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class CustomDialogService {
  private readonly dialog = inject(Dialog);

  async show(data: CustomDialogData) {
    return await firstValueFrom(
      this.dialog
        .open<boolean>(CustomDialogComponent, { data })
        .closed.pipe(map((result) => result === true)),
    );
  }
}
