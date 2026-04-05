import { Routes } from '@angular/router';
import { DevOpsDashboardComponent } from './devops-dashboard/devops-dashboard.component';
import { ContainerListComponent } from './container-list/container-list.component';
import { TerminalComponent } from './terminal/terminal.component';
import { LogViewerComponent } from './log-viewer/log-viewer.component';
import { DeploymentManagerComponent } from './deployment-manager/deployment-manager.component';

export const DEVOPS_ROUTES: Routes = [
  {
    path: '',
    component: DevOpsDashboardComponent,
    children: [
      { path: 'infrastructure', component: ContainerListComponent },
      { path: 'deployments', component: DeploymentManagerComponent },
      { path: 'terminal', component: TerminalComponent },
      { path: 'terminal/:containerId', component: TerminalComponent },
      { path: 'host-terminal', component: TerminalComponent },
      { path: 'logs/:containerId', component: LogViewerComponent },
      { path: '', redirectTo: 'infrastructure', pathMatch: 'full' }
    ]
  }
];
