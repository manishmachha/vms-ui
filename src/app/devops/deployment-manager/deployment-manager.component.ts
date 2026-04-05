import { Component, OnInit, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DevOpsService } from '../../services/devops.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-deployment-manager',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in duration-500">
      <!-- SIDEBAR -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Repo Toggle -->
        <div class="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-1 flex gap-1 shadow-2xl mt-8">
          <button (click)="setRepoType('vms-backend')"
                  [class]="repoType() === 'vms-backend' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'"
                  class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            Backend
          </button>
          <button (click)="setRepoType('vms-ui')"
                  [class]="repoType() === 'vms-ui' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'"
                  class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            Frontend
          </button>
        </div>

        <!-- Branch List -->
        <div class="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
          <div class="space-y-2">
            <button *ngFor="let branch of branches()" 
                    (click)="selectBranch(branch)"
                    [class]="selectedBranch() === branch ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-600'"
                    class="w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3">
              <i class="bi bi-git opacity-50"></i>
              <span class="font-bold text-xs truncate">{{ branch }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="lg:col-span-3 space-y-8">
        <!-- Empty State -->
        <div *ngIf="!selectedBranch()" 
             class="h-[500px] flex flex-col items-center justify-center p-12 bg-slate-800/10 rounded-[2.5rem] border-2 border-dashed border-slate-700/30 grayscale opacity-30">
          <p class="text-lg font-bold">Select a branch</p>
          <p class="text-xs text-slate-500 uppercase tracking-widest">To manage preview lifecycle</p>
        </div>

        <!-- Selection Board -->
        <div *ngIf="selectedBranch()" class="space-y-8 animate-in zoom-in-95 duration-300">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] border border-slate-700/50 p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
            <div class="space-y-2">
              <h3 class="text-3xl font-black text-white italic tracking-tight">{{ selectedBranch() }}</h3>
              <p class="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Preview URL: https://{{ (selectedBranch() || '').split('/').pop() | lowercase }}.solventek.com
              </p>
            </div>
            <div class="flex gap-4">
              <button (click)="deploy()" [disabled]="deploying()"
                      class="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-black text-xs text-white transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50">
                {{ deploying() ? 'DEPLOYING...' : 'SPAWN PREVIEW' }}
              </button>
              <button (click)="undeploy()" [disabled]="deploying()"
                      class="bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 px-6 py-4 rounded-2xl border border-slate-700 transition-all font-bold text-xs uppercase tracking-widest pointer-events-auto">
                Undeploy
              </button>
            </div>
          </div>

          <!-- Commits Section -->
          <div class="bg-slate-800/30 rounded-[2.5rem] border border-slate-700/30 p-10">
            <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
               <i class="bi bi-clock-history"></i> Commit History
            </h4>
            
            <div *ngIf="loadingCommits()" class="h-20 flex items-center justify-center text-slate-500 italic text-sm">
               Fetching latest commits...
            </div>

            <div *ngIf="!loadingCommits()" class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div *ngFor="let commit of commits()" class="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all group">
                <div class="flex justify-between items-start mb-2">
                  <p class="font-bold text-slate-200 text-sm group-hover:text-indigo-300 transition-colors">{{ commit.message }}</p>
                  <span class="bg-slate-800 px-2 py-1 rounded text-[9px] text-slate-500 font-mono">{{ commit.hash }}</span>
                </div>
                <div class="flex items-center gap-3 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                   <div class="flex items-center gap-1.5 font-bold text-slate-400">
                     <i class="bi bi-person-circle"></i> {{ commit.author }}
                   </div>
                   <span class="w-1 h-1 rounded-full bg-slate-700"></span>
                   <span>{{ commit.time | date:'short' }}</span>
                </div>
              </div>
              
              <div *ngIf="commits().length === 0" class="p-10 text-center text-slate-600 italic">
                No commits found for this branch.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
    :host { display: block; width: 100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeploymentManagerComponent implements OnInit, OnDestroy {
  branches = signal<string[]>([]);
  selectedBranch = signal<string | null>(null);
  commits = signal<any[]>([]);
  loadingCommits = signal(false);
  deploying = signal(false);
  repoType = signal<'vms-backend' | 'vms-ui'>('vms-backend');

  private subRepo?: Subscription;

  constructor(private devOpsService: DevOpsService) {}

  ngOnInit(): void {
    this.fetchBranches();
  }

  ngOnDestroy(): void {
    this.subRepo?.unsubscribe();
  }

  setRepoType(type: 'vms-backend' | 'vms-ui'): void {
    this.repoType.set(type);
    this.selectedBranch.set(null);
    this.commits.set([]);
    this.fetchBranches();
  }

  fetchBranches(): void {
    this.devOpsService.getBranches(this.repoType()).subscribe(data => {
      this.branches.set(data);
    });
  }

  selectBranch(branch: string): void {
    this.selectedBranch.set(branch);
    this.loadingCommits.set(true);
    // Force accuracy by passing repoType
    this.devOpsService.getCommits(branch, this.repoType()).subscribe({
      next: (data) => {
        this.commits.set(data);
        this.loadingCommits.set(false);
      },
      error: () => {
        this.loadingCommits.set(false);
        this.commits.set([]);
      }
    });
  }

  deploy(): void {
    const branch = this.selectedBranch();
    if (!branch) return;
    
    // Safety guard for main/master should be in backend, but we help here too
    if (['main', 'master', 'www', 'production'].includes(branch.toLowerCase())) {
        alert('Cannot spawn preview for production branches.');
        return;
    }

    const imageTag = `feature-${branch.replace('feature/', '').replace(/\//g, '-')}`;
    this.deploying.set(true);
    this.devOpsService.deploy(branch, imageTag).subscribe({
      next: () => {
        this.deploying.set(false);
        alert('Preview environment triggered for: ' + branch);
      },
      error: (err) => {
        this.deploying.set(false);
        alert('Spawn Error: ' + err.message);
      }
    });
  }

  undeploy(): void {
    const branch = this.selectedBranch();
    if (!branch || !confirm(`Kill environment ${branch}?`)) return;
    
    this.devOpsService.undeploy(branch).subscribe({
      next: () => {
        alert('Environment cleaned up.');
        this.selectedBranch.set(null);
        this.fetchBranches();
      },
      error: (err) => alert('Undeploy Fail: ' + err.message)
    });
  }
}
