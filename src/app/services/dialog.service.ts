import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  confirm(
    title: string,
    message: string,
    type: 'primary' | 'danger' | 'warning' | 'success' = 'primary',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message, type, confirmText, cancelText },
      panelClass: 'dialog-modern'
    });

    return dialogRef.afterClosed();
  }

  alert(title: string, message: string, type: 'primary' | 'danger' | 'warning' | 'success' = 'primary'): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message, type, confirmText: 'OK', cancelText: '' },
      panelClass: 'dialog-modern'
    });
  }

  // Helper for common delete confirmations
  confirmDelete(entityName: string): Observable<boolean> {
    return this.confirm(
      'Confirm Delete',
      `Are you sure you want to delete ${entityName}? This action cannot be undone.`,
      'danger',
      'Delete'
    );
  }
}
