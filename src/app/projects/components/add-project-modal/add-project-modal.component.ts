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
import { ProjectService } from '../../../services/project.service';
import { Client } from '../../../models/client.model';
import { Project } from '../../../models/project.model';
import { ModalComponent } from '../../../layout/components/modal/modal.component';

@Component({
  selector: 'app-add-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.css'],
})
export class AddProjectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() clients: Client[] = [];
  @Input() editProject: Project | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);


  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    clientId: [null as string | number | null],
    startDate: [''],
    endDate: [''],
    requestId: [''],
    billRate: [null as number | null],
    payRate: [null as number | null],
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.projectForm.reset();

      if (this.editProject) {
        // Editing existing project
        this.projectForm.patchValue({
          name: this.editProject.name,
          description: this.editProject.description || '',
          clientId: this.editProject.client?.id || null,
          startDate: this.editProject.startDate || '',
          endDate: this.editProject.endDate || '',
          requestId: this.editProject.requestId || '',
          billRate: this.editProject.billRate || null,
          payRate: this.editProject.payRate || null,
        });
      } else {
        // Creating new project
        this.projectForm.patchValue({ clientId: null });
      }
    }
  }

  saveProject() {
    if (this.projectForm.valid) {
      const formVal = this.projectForm.value;
      const payload: any = {
        name: formVal.name,
        description: formVal.description,
        startDate: formVal.startDate,
        endDate: formVal.endDate,
        requestId: formVal.requestId || undefined,
        billRate: formVal.billRate || undefined,
        payRate: formVal.payRate || undefined,
        clientId: formVal.clientId ? Number(formVal.clientId) : undefined,
      };

      const request$ = this.editProject
        ? this.projectService.updateProject(this.editProject.id, payload)
        : this.projectService.createProject(payload);

      request$.subscribe({
        next: () => {
          this.saved.emit();
          this.onClose();
        },
        error: (err: any) => {
          console.error(err);
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
