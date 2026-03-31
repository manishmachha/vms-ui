import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../services/application.service';
import { NotificationService } from '../../services/notification.service';
import { HeaderService } from '../../services/header.service';
import { JobApplication } from '../../models/application.model';

@Component({
  selector: 'app-vendor-application-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendor-application-list.component.html',
  styleUrls: ['./vendor-application-list.component.css'],
})
export class VendorApplicationListComponent implements OnInit {
  applicationService = inject(ApplicationService);
  notificationService = inject(NotificationService);
  headerService = inject(HeaderService);
  applications = signal<JobApplication[]>([]);
  unreadAppIds = new Set<string>();

  ngOnInit() {
    this.headerService.setTitle(
      'My Applications',
      'Track the status of your candidates',
      'bi bi-people',
    );
    this.loadUnreadAppIds();
    this.applicationService.getApplications().subscribe((page) => {
      // Sort: notified first
      const sorted = [...page.content].sort((a, b) => {
        const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
        const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
        return bHasNotif - aHasNotif;
      });
      this.applications.set(sorted);
    });
  }

  loadUnreadAppIds() {
    this.notificationService.getUnreadEntityIds('APPLICATION').subscribe({
      next: (ids) => (this.unreadAppIds = new Set(ids.map(String))),
      error: () => (this.unreadAppIds = new Set()),
    });
  }

  hasNotification(appId: string | number): boolean {
    return this.unreadAppIds.has(String(appId));
  }
}
