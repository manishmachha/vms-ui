import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { HeaderService } from '../../services/header.service';
import { Project, ProjectAllocation, UserSummary } from '../../models/project.model';
import { UserService } from '../../services/user.service';
import { User } from '../../models/auth.model';
import { OrganizationLogoComponent } from '../../layout/components/organization-logo/organization-logo.component';
import { AllocateResourceModalComponent } from '../components/allocate-resource-modal/allocate-resource-modal.component';
import { UserAvatarComponent } from '../../layout/components/user-avatar/user-avatar.component';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../candidates/models/candidate.model';
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    OrganizationLogoComponent,
    AllocateResourceModalComponent,
    UserAvatarComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);

  project = signal<Project | null>(null);
  allocations = signal<ProjectAllocation[]>([]);
  users = signal<User[]>([]);
  candidates = signal<Candidate[]>([]);

  showAllocateModal = false;
  showDeallocateConfirm = false;
  allocationToRemove: ProjectAllocation | null = null;
  deallocating = false;

  private colors = [
    '#6366f1',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#14b8a6',
    '#f97316',
    '#ec4899',
  ];

  // Computed values
  totalAllocation = computed(() =>
    this.allocations().reduce((sum, a) => sum + a.allocationPercentage, 0),
  );
  avgAllocation = computed(() => {
    const allocs = this.allocations();
    return allocs.length ? Math.round(this.totalAllocation() / allocs.length) : 0;
  });

  projectDuration = computed(() => {
    const p = this.project();
    if (!p?.startDate) return 'N/A';
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : new Date();
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months <= 1 ? '1 mo' : `${months} mo`;
  });

  chartSegments = computed(() => {
    const allocs = this.allocations();
    if (!allocs.length) return [];

    const total = this.totalAllocation();
    const circumference = 2 * Math.PI * 40;
    let offset = 0;

    return allocs.map((alloc, i) => {
      const percentage = alloc.allocationPercentage / total;
      const dashLength = circumference * percentage;
      const dashArray = `${dashLength} ${circumference - dashLength}`;
      const segment = {
        color: this.colors[i % this.colors.length],
        dashArray,
        offset: -offset,
      };
      offset += dashLength;
      return segment;
    });
  });

  ngOnInit() {
    this.headerService.setTitle(
      'Project Details',
      'View project information and allocations',
      'bi bi-kanban',
    );
    const projectIdStr = this.route.snapshot.paramMap.get('id');
    if (projectIdStr) {
      const projectId = Number(projectIdStr);
      this.loadProject(projectId);
      this.loadAllocations(projectId);
    }
    this.loadUsers();
    this.loadCandidates();
  }

  loadProject(id: number) {
    this.projectService.getProject(id).subscribe((p) => {
      this.project.set(p);
    });
  }

  loadAllocations(id: number) {
    this.projectService.getAllocations(id).subscribe((data) => {
      this.allocations.set(data);
    });
  }

  loadUsers() {
    this.userService.getUsers(0, 100).subscribe((users: User[]) => {
      this.users.set(users);
    });
  }

  loadCandidates() {
    this.candidateService.getCandidates().subscribe((data: Candidate[]) => {
      this.candidates.set(data);
    });
  }

  getColor(alloc: ProjectAllocation): string {
    const index = this.allocations().indexOf(alloc);
    return this.colors[index % this.colors.length];
  }

  getTimelineOffset(alloc: ProjectAllocation): number {
    const p = this.project();
    if (!p?.startDate || !alloc.startDate) return 0;
    const projectStart = new Date(p.startDate).getTime();
    const projectEnd = p.endDate ? new Date(p.endDate).getTime() : Date.now();
    const allocStart = new Date(alloc.startDate).getTime();
    return ((allocStart - projectStart) / (projectEnd - projectStart)) * 100;
  }

  getTimelineWidth(alloc: ProjectAllocation): number {
    const p = this.project();
    if (!p?.startDate || !alloc.startDate) return 0;
    const projectStart = new Date(p.startDate).getTime();
    const projectEnd = p.endDate ? new Date(p.endDate).getTime() : Date.now();
    const allocStart = new Date(alloc.startDate).getTime();
    const allocEnd = alloc.endDate ? new Date(alloc.endDate).getTime() : projectEnd;
    return Math.min(100, ((allocEnd - allocStart) / (projectEnd - projectStart)) * 100);
  }

  confirmDeallocate(alloc: ProjectAllocation) {
    this.allocationToRemove = alloc;
    this.showDeallocateConfirm = true;
  }

  deallocate() {
    if (!this.allocationToRemove || !this.project()) return;
    this.deallocating = true;

    this.projectService.deallocateUser(this.project()!.id, this.allocationToRemove.id).subscribe({
      next: () => {
        this.loadAllocations(this.project()!.id);
        this.showDeallocateConfirm = false;
        this.allocationToRemove = null;
        this.deallocating = false;
      },
      error: (err) => {
        console.error('Failed to deallocate', err);
        this.deallocating = false;
      },
    });
  }
}
