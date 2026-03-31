import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobService } from '../../services/job.service';
import { Job, JobStatus } from '../../models/job.model';
import { AuthStore } from '../../services/auth.store';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApplicationService } from '../../services/application.service';
import { Candidate } from '../../candidates/models/candidate.model';
import { TimelineComponent } from '../../layout/components/timeline/timeline.component';
import { ApplicationFormComponent } from '../../applications/application-form/application-form.component';
import { MatDialog } from '@angular/material/dialog';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { HeaderService } from '../../services/header.service';
import { JobApplication } from '../../models/application.model';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule,
    TimelineComponent,
    OrganizationLogoComponent,
  ],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css'],
})
export class JobDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  jobService = inject(JobService);
  authStore = inject(AuthStore);
  fb = inject(FormBuilder);
  applicationService = inject(ApplicationService);
  dialog = inject(MatDialog);
  headerService = inject(HeaderService);

  job = signal<Job | null>(null);
  showEnrichForm = false;
  showFinalVerifyForm = false;
  showApplyModal = false;
  myCandidates = signal<Candidate[]>([]);
  selectedCandidateId = '';
  applications = signal<JobApplication[]>([]);
  groupedApplications = computed(() => {
    const apps = this.applications();
    const groups = new Map<string, JobApplication[]>();
    apps.forEach((app) => {
      const vendorName = app.vendor?.name || 'In-house / Direct';
      if (!groups.has(vendorName)) groups.set(vendorName, []);
      groups.get(vendorName)!.push(app);
    });
    return Array.from(groups.entries());
  });

  enrichForm = this.fb.group({
    requirements: ['', Validators.required],
    rolesAndResponsibilities: ['', Validators.required],
    experience: ['', Validators.required],
    skills: ['', Validators.required],
  });

  finalVerifyForm = this.fb.group({
    billRate: [0, Validators.required],
    payRate: [0, Validators.required],
  });

  ngOnInit() {
    this.headerService.setTitle('Job Details', 'View job details', 'bi bi-briefcase');
    this.loadJob();
  }

  loadJob() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobService.getJob(id).subscribe((data) => {
        this.job.set(data);
      });
      this.applicationService.getApplications(id).subscribe((res) => {
        this.applications.set(res.content);
      });
    }
  }

  // Permission Checks - Allow all Solventek admins/TA (non-employee) for basic management
  canManage() {
    return !this.authStore.isEmployee() && this.authStore.orgType() === 'SOLVENTEK';
  }

  // Critical actions restricted to Super Admin and HR Admin (No TA)
  canPerformCriticalAction() {
    return this.canManage() && !this.authStore.isTA();
  }

  canVerify() {
    return (
      this.canPerformCriticalAction() &&
      (this.job()?.status === 'SUBMITTED' || this.job()?.status === 'DRAFT')
    );
  }
  canEnrich() {
    return (
      this.canManage() && // TA can enrich
      this.job()?.status === 'ADMIN_VERIFIED'
    );
  }
  canFinalVerify() {
    return (
      this.canPerformCriticalAction() && // TA cannot final verify/approve
      (this.job()?.status === 'TA_ENRICHED' || this.job()?.status === 'ADMIN_VERIFIED')
    );
  }
  canPublish() {
    return (
      this.canPerformCriticalAction() && // TA cannot publish
      this.job()?.status === 'ADMIN_FINAL_VERIFIED'
    );
  }

  // Formatters
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatEmploymentType(type: string | undefined): string {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getSkillCount(): number {
    return this.job()?.skills?.split(',').length || 0;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'ADMIN_VERIFIED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'TA_ENRICHED':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bi-globe';
      case 'DRAFT':
        return 'bi-file-earmark';
      case 'SUBMITTED':
        return 'bi-send';
      case 'ADMIN_VERIFIED':
        return 'bi-check-circle';
      case 'TA_ENRICHED':
        return 'bi-stars';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bi-shield-check';
      case 'CLOSED':
        return 'bi-x-circle';
      default:
        return 'bi-circle';
    }
  }

  openApplyDialog(job: Job) {
    this.dialog.open(ApplicationFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { job },
    });
  }

  // Actions
  verify() {
    if (confirm('Verify this job?')) {
      this.jobService.verifyJob(this.job()!.id).subscribe(() => this.loadJob());
    }
  }

  openEnrichForm() {
    this.showEnrichForm = true;
    const currentJob = this.job();
    if (currentJob) {
      this.enrichForm.patchValue({
        requirements: currentJob.requirements || '',
        rolesAndResponsibilities: currentJob.rolesAndResponsibilities || '',
        experience: currentJob.experience || '',
        skills: currentJob.skills || '',
      });
    }
  }

  skipEnrichment() {
    if (confirm('Are you sure you want to skip enrichment?')) {
      this.jobService
        .updateStatus(this.job()!.id, 'TA_ENRICHED', 'Enrichment skipped')
        .subscribe({
          next: () => {
            this.showEnrichForm = false;
            this.loadJob();
          },
          error: (err: any) => {
            console.error(err);
          },
        });
    }
  }

  onEnrich() {
    if (this.enrichForm.valid) {
      this.jobService.enrichJob(this.job()!.id, this.enrichForm.value as any).subscribe(() => {
        this.showEnrichForm = false;
        this.loadJob();
      });
    }
  }

  onFinalVerify() {
    if (this.finalVerifyForm.valid) {
      this.jobService
        .finalVerifyJob(this.job()!.id, this.finalVerifyForm.value as any)
        .subscribe(() => {
          this.showFinalVerifyForm = false;
          this.loadJob();
        });
    }
  }

  publish() {
    if (confirm('Publish this job?')) {
      this.jobService.publishJob(this.job()!.id).subscribe(() => this.loadJob());
    }
  }

  deleteJob() {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      this.jobService.deleteJob(this.job()!.id).subscribe(() => {
        this.router.navigate(['/jobs']);
      });
    }
  }

  showUpdateStatusForm = false;
  updateStatusForm = this.fb.group({
    status: ['', Validators.required],
    message: [''],
  });

  onUpdateStatus() {
    if (this.updateStatusForm.valid) {
      this.jobService
        .updateStatus(
          this.job()!.id,
          this.updateStatusForm.value.status!,
          this.updateStatusForm.value.message || '',
        )
        .subscribe(() => {
          this.showUpdateStatusForm = false;
          this.loadJob();
        });
    }
  }
}
