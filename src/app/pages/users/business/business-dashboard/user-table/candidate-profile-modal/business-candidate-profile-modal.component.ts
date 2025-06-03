// candidate-profile-modal.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateComponent } from 'src/app/pages/users/candidate/candidate.component';

@Component({
  selector: 'app-business-candidate-profile-modal',
  standalone: true,
  imports: [CommonModule, CandidateComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './business-candidate-profile-modal.component.html',
  styleUrls: ['./business-candidate-profile-modal.component.css']
})
export class BusinessCandidateProfileModalComponent {
  @Input() user: any;
  @Input() close!: () => void;

  // Add this to ensure readOnly mode
  get readOnly(): boolean {
    return true;
  }

  // Propiedad para indicar que no es el propietario
  get isOwner(): boolean {
    return false;
  }
}