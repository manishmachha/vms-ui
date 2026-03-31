import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.css'],
})
export class UserAvatarComponent implements OnChanges {
  @Input() user: {
    id: string | number;
    firstName: string;
    lastName: string;
  } | null = null;
  @Input() fontSizeClass = 'text-xs';

  avatarUrl = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.updateAvatarUrl();
    }
  }

  private updateAvatarUrl() {
    this.setFallbackUrl();
  }

  onImageError() {
    this.setFallbackUrl();
  }

  private setFallbackUrl() {
    if (this.user) {
      const name = `${this.user.firstName}+${this.user.lastName}`;
      this.avatarUrl.set(`https://ui-avatars.com/api/?name=${name}&background=random`);
    } else {
      // Generic fallback
      this.avatarUrl.set('https://ui-avatars.com/api/?name=User&background=random');
    }
  }
}
