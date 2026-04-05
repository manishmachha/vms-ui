import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-devops-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './devops-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevOpsDashboardComponent {
  // The dashboard is now a clean shell for the DevOps sub-routes.
  // Repository and Branch logic has been moved to DeploymentManagerComponent.
  constructor() {}
}
