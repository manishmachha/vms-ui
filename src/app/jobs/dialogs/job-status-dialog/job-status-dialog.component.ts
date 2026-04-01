import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { JobService } from '../../../services/job.service';

@Component({
  selector: 'app-job-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './job-status-dialog.component.html',
})
export class JobStatusDialogComponent {
  private fb = inject(FormBuilder);
  private jobService = inject(JobService);
  public dialogRef = inject(MatDialogRef<JobStatusDialogComponent>);
  public data = inject(MAT_DIALOG_DATA);

  updateStatusForm = this.fb.group({
    status: [this.data.job.status || '', Validators.required],
    message: [''],
  });

  onUpdateStatus() {
    if (this.updateStatusForm.valid) {
      const { status, message } = this.updateStatusForm.value;
      this.jobService.updateStatus(this.data.job.id, status!, message || '').subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Status update failed', err)
      });
    }
  }
}
