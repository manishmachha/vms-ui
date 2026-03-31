import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderService } from '../../services/header.service';
import { AuthStore } from '../../services/auth.store';
import { DashboardService, RecentActivity } from '../../services/dashboard.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { HubDashboardBannerComponent } from '../../shared/components/hub-dashboard-banner/hub-dashboard-banner.component';
import { StatItem } from '../../models/dashboard-stats.model';
import { InterviewCalendarComponent } from '../../layout/components/interview-calendar/interview-calendar.component';
import { forkJoin } from 'rxjs';
import { JobService } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { InterviewService } from '../../services/interview.service';
import { CandidateService } from '../../services/candidate.service';
import { ProjectService } from '../../services/project.service';

interface FunnelStage {
  name: string;
  count: number;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, HubDashboardBannerComponent, DatePipe, InterviewCalendarComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="space-y-8 animate-fade-in pb-8">
      
      <!-- Top Banner Stats -->
      <div>
        <app-hub-dashboard-banner [stats]="stats()"></app-hub-dashboard-banner>
      </div>

      <!-- Welcome Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Platform Command Center</h2>
          <p class="text-gray-500">Global analytics across all organizations</p>
        </div>
        <div class="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span class="text-sm font-medium text-gray-600">System Live</span>
        </div>
      </div>

      <!-- Key Metrics Summary Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i class="bi bi-briefcase-fill text-lg"></i>
            </div>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Jobs</span>
          </div>
          <p class="text-3xl font-black text-gray-900">{{ totalActiveJobs() }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i class="bi bi-people-fill text-lg"></i>
            </div>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Users</span>
          </div>
          <p class="text-3xl font-black text-gray-900">{{ totalEmployees() }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <i class="bi bi-file-earmark-text-fill text-lg"></i>
            </div>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Applications</span>
          </div>
          <p class="text-3xl font-black text-gray-900">{{ totalApplications() }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <i class="bi bi-clock-history text-lg"></i>
            </div>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</span>
          </div>
          <p class="text-3xl font-black text-gray-900">{{ pendingApprovals() }}</p>
        </div>
      </div>

      <!-- Recruitment Funnel -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[250px]">
        <div class="flex items-center justify-between mb-8">
          <h3 class="font-bold text-gray-900 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <i class="bi bi-funnel"></i>
            </div>
            Recruitment Funnel
          </h3>
          <span class="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Active Pipeline</span>
        </div>
        
        <div class="flex-1 flex items-center justify-between gap-2 px-4">
          <div *ngFor="let stage of funnelStages(); let i = index" class="flex-1 relative group">
            <div class="text-center p-4 rounded-2xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-white"
                 [style.background]="stage.bgColor">
              <p class="text-3xl font-black mb-1 group-hover:scale-110 transition-transform" [style.color]="stage.color">{{ stage.count }}</p>
              <p class="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{{ stage.name }}</p>
            </div>
            <div *ngIf="i < funnelStages().length - 1" class="absolute top-1/2 -right-1 transform -translate-y-1/2 z-10 hidden md:block">
              <div class="w-2 h-2 rounded-full bg-gray-200 border-2 border-white"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Applications by Job (Horizontal Bar) -->
        <div class="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-gray-900 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
                <i class="bi bi-bar-chart-steps"></i>
              </div>
              Applications by Job
            </h3>
          </div>
          <div class="h-[280px]">
            <canvas baseChart
              [data]="jobsChartData"
              [type]="'bar'"
              [options]="barChartOptions"
              class="w-full h-full">
            </canvas>
          </div>
        </div>

        <!-- Source Analytics -->
        <div class="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <i class="bi bi-pie-chart"></i>
            </div>
            Source Analytics
          </h3>
          <div class="h-48 relative">
            <canvas baseChart
              [data]="sourceChartData"
              [type]="'doughnut'"
              [options]="doughnutChartOptions"
              class="w-full h-full">
            </canvas>
          </div>
        </div>
      </div>

      <!-- Pipeline & Distribution Charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Recruitment Pipeline -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[360px] hover:shadow-md transition-shadow">
          <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i class="bi bi-funnel text-lg"></i>
            </div>
            Status Breakdown
          </h3>
          <div class="flex-1 relative min-w-0 min-h-0">
            <canvas baseChart [data]="pipelineChartData" [type]="'bar'" [options]="verticalBarChartOptions" class="w-full h-full"></canvas>
          </div>
        </div>

        <!-- Organization Distribution -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[360px] hover:shadow-md transition-shadow">
          <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i class="bi bi-diagram-3 text-lg"></i>
            </div>
            Platform Distribution
          </h3>
          <div class="flex-1 relative min-w-0 min-h-0">
            <canvas baseChart [data]="orgDistChartData" [type]="'doughnut'" [options]="orgDoughnutOptions" class="w-full h-full"></canvas>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Activity Feed Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Quick Actions -->
        <div class="space-y-4">
          <h3 class="font-bold text-slate-800 text-lg">Quick Actions</h3>
          <div class="grid grid-cols-1 gap-4">
            <a routerLink="/jobs/create" class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl text-indigo-600 bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-briefcase text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Post New Job</h3>
                <p class="text-xs text-gray-500">Create a new job listing</p>
              </div>
            </a>
            <a routerLink="/users/" class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-pointer hover:border-purple-300 hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl text-purple-600 bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-person-plus text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">Manage Users</h3>
                <p class="text-xs text-gray-500">Admin accounts & roles</p>
              </div>
            </a>
            <a routerLink="/vendors" class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-pointer hover:border-teal-300 hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl text-teal-600 bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-shop text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">View Vendors</h3>
                <p class="text-xs text-gray-500">Manage vendor organizations</p>
              </div>
            </a>
            <a routerLink="/applications" class="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all">
              <div class="w-12 h-12 rounded-xl text-emerald-600 bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i class="bi bi-file-earmark-check text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Review Applications</h3>
                <p class="text-xs text-gray-500">Process pending submissions</p>
              </div>
            </a>
          </div>
        </div>

        <!-- Activity Feed -->
        <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col max-h-[600px] overflow-hidden">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-slate-800 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <i class="bi bi-activity text-lg"></i>
              </div>
              Global Activity Feed
            </h3>
            <span class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">Live</span>
          </div>
          
          <div class="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            @if(loading()) {
              <div class="flex justify-center items-center h-32">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            } @else {
              @for (activity of activities(); track activity.id) {
                <div class="relative pl-6 border-l-2 border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-100" [ngClass]="getActivityBadgeColor(activity.action)"></div>
                  <div class="mb-1">
                    <span class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mr-2">{{ activity.orgName }}</span>
                    <span class="text-xs text-slate-500">{{ activity.createdAt | date:'short' }}</span>
                  </div>
                  <p class="text-sm font-medium text-slate-800">{{ activity.title }}</p>
                  <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ activity.message }}</p>
                </div>
              }
              @if(activities().length === 0) {
                <div class="text-center text-slate-500 py-8">
                  <i class="bi bi-inbox text-3xl mb-3 block opacity-50"></i>
                  <p class="text-sm">No recent activity found.</p>
                </div>
              }
            }
          </div>
        </div>
      </div>

      <!-- Interview Calendar -->
      <div class="grid grid-cols-1">
        <app-interview-calendar></app-interview-calendar>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
  `]
})
export class SuperadminDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);
  dashboardService = inject(DashboardService);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);
  interviewService = inject(InterviewService);
  candidateService = inject(CandidateService);
  projectService = inject(ProjectService);

  loading = signal(true);
  stats = signal<StatItem[]>([]);
  activities = signal<RecentActivity[]>([]);
  totalActiveJobs = signal(0);
  totalEmployees = signal(0);
  totalApplications = signal(0);
  pendingApprovals = signal(0);

  funnelStages = signal<FunnelStage[]>([
    { name: 'Applied', count: 0, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
    { name: 'Screening', count: 0, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    { name: 'Interview', count: 0, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
    { name: 'Offer', count: 0, color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' },
    { name: 'Hired', count: 0, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  ]);

  // Chart configurations
  orgDoughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
      }
    },
  };

  verticalBarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        border: { display: false }
      }
    },
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
      }
    },
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: { 
      x: { 
        beginAtZero: true,
        grid: { display: false }
      },
      y: {
        grid: { display: false }
      }
    },
    plugins: { 
      legend: { display: false }
    },
  };

  doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: { boxWidth: 8, usePointStyle: true, padding: 15, font: { size: 10 } } 
      } 
    },
  };

  orgDistChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  pipelineChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Count', backgroundColor: '#6366f1' }],
  };

  jobsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Applications',
        backgroundColor: '#6366f1',
        borderRadius: 6,
        hoverBackgroundColor: '#4f46e5'
      },
    ],
  };

  sourceChartData: ChartData<'doughnut'> = {
    labels: ['Vendor', 'Direct / Internal'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#8b5cf6', '#10b981'],
        borderWidth: 0
      },
    ],
  };

  ngOnInit() {
    this.headerService.setTitle(
      'Super Admin Hub',
      'Global platform insights and real-time activity',
      'bi bi-globe'
    );
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Load admin dashboard stats from backend
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        // Set Banner Stats
        if (data.stats && data.stats.length > 0) {
          this.stats.set(data.stats);
        }

        // Set Recent Activity
        if (data.recentActivity) {
          this.activities.set(data.recentActivity);
        }

        // Set top-level metrics
        this.totalActiveJobs.set(data.totalActiveJobs || 0);
        this.totalEmployees.set(data.totalEmployees || 0);
        this.totalApplications.set(data.totalApplications || 0);
        this.pendingApprovals.set(data.pendingApprovals || 0);

        // Set Organization Distribution (Doughnut)
        if (data.orgDistribution) {
          this.orgDistChartData = {
            labels: data.orgDistribution.map((d) => d.label),
            datasets: [
              {
                data: data.orgDistribution.map((d) => d.value),
                backgroundColor: ['#64748b', '#06b6d4', '#f59e0b', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 4
              },
            ],
          };
        }

        // Set Pipeline (Bar Chart)
        if (data.recruitmentPipeline) {
          this.pipelineChartData = {
            labels: data.recruitmentPipeline.map((d) => d.label.replace('_', ' ')),
            datasets: [
              {
                data: data.recruitmentPipeline.map((d) => d.value),
                label: 'Applications',
                backgroundColor: '#6366f1',
                hoverBackgroundColor: '#4f46e5',
                borderRadius: 4,
                barPercentage: 0.6
              },
            ],
          };
        }

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Load detailed application data for funnel + charts (like manager-dashboard)
    forkJoin({
      applications: this.applicationService.getApplications(undefined, 0, 1000),
    }).subscribe({
      next: ({ applications }) => {
        const apps = applications.content || [];
        
        // Funnel Processing
        const applied = apps.filter((a: any) => a.status === 'APPLIED').length;
        const screening = apps.filter((a: any) => ['SCREENING', 'SHORTLISTED'].includes(a.status)).length;
        const interview = apps.filter((a: any) => ['INTERVIEW_SCHEDULED', 'INTERVIEW_PASSED', 'INTERVIEW_FAILED'].includes(a.status)).length;
        const offer = apps.filter((a: any) => ['OFFER_RELEASED', 'OFFER_ACCEPTED', 'OFFERED'].includes(a.status)).length;
        const hired = apps.filter((a: any) => ['ONBOARDING_IN_PROGRESS', 'ONBOARDED', 'CONVERTED_TO_FTE', 'HIRED'].includes(a.status)).length;

        this.funnelStages.set([
          { name: 'Applied', count: applied, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
          { name: 'Screening', count: screening, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
          { name: 'Interview', count: interview, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
          { name: 'Offer', count: offer, color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' },
          { name: 'Hired', count: hired, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
        ]);

        // Applications by Job chart
        const appsByJob: Record<string, number> = {};
        apps.forEach((app: any) => {
          const title = app.job?.title || 'Unknown Position';
          appsByJob[title] = (appsByJob[title] || 0) + 1;
        });

        const topJobs = Object.entries(appsByJob)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6);

        this.jobsChartData = {
          labels: topJobs.map(([t]) => t),
          datasets: [
            {
              data: topJobs.map(([, c]) => c),
              label: 'Applications',
              backgroundColor: '#6366f1',
              borderRadius: 6,
              hoverBackgroundColor: '#4f46e5'
            },
          ],
        };

        // Source analytics
        const vendorApps = apps.filter((a: any) => !!a.vendor).length;
        const directApps = apps.length - vendorApps;

        this.sourceChartData = {
          labels: ['Vendor', 'Direct / Internal'],
          datasets: [
            {
              data: [vendorApps, directApps],
              backgroundColor: ['#8b5cf6', '#10b981'],
              borderWidth: 0
            },
          ],
        };
      },
      error: (err) => console.error('Failed to load application data', err)
    });
  }

  getActivityBadgeColor(action: string): string {
    const act = action?.toUpperCase() || '';
    if (act.includes('CREATE') || act.includes('ADD')) return '!border-emerald-500';
    if (act.includes('UPDATE') || act.includes('EDIT')) return '!border-blue-500';
    if (act.includes('DELETE') || act.includes('REMOVE')) return '!border-red-500';
    if (act.includes('APPROVE')) return '!border-indigo-500';
    return '!border-slate-300';
  }
}
