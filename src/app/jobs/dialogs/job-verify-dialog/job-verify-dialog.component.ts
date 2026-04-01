import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { JobService } from '../../../services/job.service';

@Component({
  selector: 'app-job-verify-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './job-verify-dialog.component.html',
})
export class JobVerifyDialogComponent {
  private fb = inject(FormBuilder);
  private jobService = inject(JobService);
  public dialogRef = inject(MatDialogRef<JobVerifyDialogComponent>);
  public data = inject(MAT_DIALOG_DATA);

  finalVerifyForm = this.fb.group({
    billRate: [this.data.job.billRate || 0, [Validators.required, Validators.min(0)]],
    payRate: [this.data.job.payRate || 0, [Validators.required, Validators.min(0)]],
  });

  onFinalVerify() {
    if (this.finalVerifyForm.valid) {
      this.jobService
        .finalVerifyJob(this.data.job.id, this.finalVerifyForm.value as any)
        .subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error('Final verification failed', err)
        });
    }
  }
}
