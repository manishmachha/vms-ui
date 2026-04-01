import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'warning' | 'success';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center gap-4 mb-4">
        <div 
          class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          [ngClass]="getIconBgClass()"
        >
          <mat-icon [class]="getIconColorClass()">{{ getIcon() }}</mat-icon>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">{{ data.title }}</h3>
          <p class="text-sm text-gray-500">{{ data.message }}</p>
        </div>
      </div>
      
      <div class="flex gap-3 justify-end mt-6">
        <button
          (click)="dialogRef.close(false)"
          class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button
          (click)="dialogRef.close(true)"
          class="px-4 py-2 rounded-lg text-white font-medium transition-all shadow-sm"
          [ngClass]="getButtonClass()"
        >
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'danger': return 'warning_amber';
      case 'warning': return 'report_problem';
      case 'success': return 'check_circle';
      default: return 'help_outline';
    }
  }

  getIconBgClass(): string {
    switch (this.data.type) {
      case 'danger': return 'bg-red-100';
      case 'warning': return 'bg-amber-100';
      case 'success': return 'bg-emerald-100';
      default: return 'bg-indigo-100';
    }
  }

  getIconColorClass(): string {
    switch (this.data.type) {
      case 'danger': return 'text-red-600!';
      case 'warning': return 'text-amber-600!';
      case 'success': return 'text-emerald-600!';
      default: return 'text-indigo-600!';
    }
  }

  getButtonClass(): string {
    switch (this.data.type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700';
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700';
      default: return 'bg-indigo-600 hover:bg-indigo-700';
    }
  }
}
