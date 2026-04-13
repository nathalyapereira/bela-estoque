import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { ConfirmDeletionData } from '../../../../core/models/common.models';

@Component({
  selector: 'app-confirm-deletion',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-deletion.component.html',
  styleUrl: './confirm-deletion.component.scss',
  template: `
    <div class="dialog-exclusao">
      <div class="dialog-icone">
        <mat-icon>warning</mat-icon>
      </div>
 
      <h2 mat-dialog-title>{{ data.title }}</h2>
 
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
 
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true">
          <mat-icon>delete</mat-icon>
          Excluir
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class ConfirmDeletionComponent {
  readonly data = inject<ConfirmDeletionData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDeletionComponent>);
}
