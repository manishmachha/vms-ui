import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService, AllocateUserRequest } from '../../../services/project.service';
import { User } from '../../../models/auth.model';
import { DialogService } from '../../../services/dialog.service';
import { ModalComponent } from '../../../layout/components/modal/modal.component';

@Component({
  selector: 'app-allocate-resource-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './allocate-resource-modal.component.html',
  styleUrls: ['./allocate-resource-modal.component.css'],
})
export class AllocateResourceModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() projectId: number | null = null;
  @Input() users: User[] = [];
  @Input() candidates: any[] = []; // Type should be Candidate[]
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private dialogService = inject(DialogService);


  allocateForm = this.fb.group({
    candidateId: ['', Validators.required],
    startDate: ['', Validators.required],
    percentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    billingRole: [''],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.allocateForm.reset({ percentage: 100 });
    }
  }

  allocateUser() {
    if (this.allocateForm.valid && this.projectId) {
      const val = this.allocateForm.value;

      const candidateIdVal = Number(val.candidateId);

      const req: AllocateUserRequest = {
        candidateId: candidateIdVal,
        startDate: val.startDate!,
        percentage: val.percentage!,
        billingRole: val.billingRole || undefined,
      };

      this.projectService.allocateUser(this.projectId, req).subscribe({
        next: () => {
          this.saved.emit();
          this.onClose();
        },
        error: () => {
          this.dialogService.open('Error', 'Failed to allocate resource');
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
