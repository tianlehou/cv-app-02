import { Component, ChangeDetectorRef, Input, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { CvInfoBarComponent } from './cv-info-bar/cv-info-bar.component';
import { CvEditButtonComponent } from './cv-edit-button/cv-edit-button.component';
import { CurriculumTypesInfoComponent } from './cv-info-bar/curriculum-types-info/curriculum-types-info.component';
import { EditAboutMeComponent } from './cv-edit-button/components/edit-about-me/edit-about-me.component';
import { EditAcademicFormationComponent } from './cv-edit-button/components/edit-academic-formation/edit-academic-formation.component';
import { EditExperienceComponent } from './cv-edit-button/components/edit-experience/edit-experience.component';
import { EditLanguagesComponent } from './cv-edit-button/components/edit-languages/edit-languages.component';
import { EditPersonalDataComponent } from './cv-edit-button/components/edit-personal-data/edit-personal-data.component';
import { EditProfilePictureComponent } from './cv-edit-button/components/edit-profile-picture/edit-profile-picture.component';
import { EditSkillsComponent } from './cv-edit-button/components/edit-skills/edit-skills.component';

@Component({
  selector: 'app-cv-grid',
  standalone: true,
  imports: [
    CommonModule,
    CvInfoBarComponent,
    CvEditButtonComponent,
    CurriculumTypesInfoComponent,
    EditAboutMeComponent,
    EditAcademicFormationComponent,
    EditExperienceComponent,
    EditLanguagesComponent,
    EditPersonalDataComponent,
    EditProfilePictureComponent,
    EditSkillsComponent,
  ],
  templateUrl: './cv-grid.component.html',
  styleUrls: ['./cv-grid.component.css'],
})
export class CvGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  userEmailKey: string | null = null;
  selectedComponent: string | null = null;
  showGalleryGrid = false; // propiedad para controlar la visibilidad

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  onOptionSelected(option: string) {
    this.selectedComponent = option;
    this.showGalleryGrid = true; // Mostrar gallery-grid cuando se selecciona una opción
    this.cdr.detectChanges();
  }

  // Método para determinar si se debe mostrar un componente específico
  shouldShowComponent(componentName: string): boolean {
    return this.selectedComponent === componentName;
  }

  // Método para cerrar el popover y restablecer la vista
  resetView() {
    this.selectedComponent = null;
    this.showGalleryGrid = false;
    this.cdr.detectChanges();
  }
}
