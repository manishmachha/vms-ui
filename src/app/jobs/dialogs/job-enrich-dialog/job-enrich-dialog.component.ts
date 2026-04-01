import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { JobService } from '../../../services/job.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-job-enrich-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './job-enrich-dialog.component.html',
})
export class JobEnrichDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobService = inject(JobService);
  private dialogService = inject(DialogService);
  public dialogRef = inject(MatDialogRef<JobEnrichDialogComponent>);
  public data = inject(MAT_DIALOG_DATA);

  enrichForm = this.fb.group({
    requirements: [this.data.job.requirements || '', Validators.required],
    rolesAndResponsibilities: [this.data.job.rolesAndResponsibilities || '', Validators.required],
    experience: [this.data.job.experience || '', Validators.required],
    skills: [this.data.job.skills || '', Validators.required],
  });

  ngOnInit() {}

  onEnrich() {
    if (this.enrichForm.valid) {
      this.jobService.enrichJob(this.data.job.id, this.enrichForm.value as any).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => {
          // Error handling
        }
      });
    }
  }

  skipEnrichment() {
    this.dialogService.confirm(
      'Confirm Skip',
      'Are you sure you want to skip enrichment? This will move the job to the next stage.',
      'warning',
      'Skip Enrichment'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.jobService.updateStatus(this.data.job.id, 'TA_ENRICHED', 'Enrichment skipped').subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error(err)
        });
      }
    });
  }
}
