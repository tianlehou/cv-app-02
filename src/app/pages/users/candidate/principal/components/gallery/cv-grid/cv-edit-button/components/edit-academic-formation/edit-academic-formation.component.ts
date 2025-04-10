import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../../../../shared/services/confirmation-modal.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-academic-formation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './edit-academic-formation.component.html',
  styleUrls: ['./edit-academic-formation.component.css'],
})
export class EditAcademicFormationComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  academicFormationIndexToDelete: number | null = null;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private ConfirmationModalService: ConfirmationModalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replaceAll('.', '_') || null;
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      academicFormation: this.fb.array([]),
    });
  }

  private setEditableFields(): void {
    this.editableFields = {
      academicFormation: false,
    };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Usuario no autenticado.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const profileData = userData?.profileData || {};
      this.populateAcademicFormation(profileData.academicFormation || []);
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
  }

  private populateAcademicFormation(formationList: any[]): void {
    const formArray = this.academicFormationArray;
    formArray.clear();
    formationList.forEach((formation) => {
      const formationGroup = this.fb.group({
        year: [formation.year || '', Validators.required],
        institution: [formation.institution || '', Validators.required],
        degree: [formation.degree || '', Validators.required],
      });
      formArray.push(formationGroup);
    });
  }

  toggleEdit(field: string): void {
    this.editableFields[field] = !this.editableFields[field];
    if (!this.editableFields[field]) {
      this.onSubmit();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.profileForm.valid || !this.userEmail) {
      alert('Error en los datos o usuario no autenticado.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const currentProfileData = userData?.profileData || {};

      const updatedProfileData = {
        ...currentProfileData,
        academicFormation: this.academicFormationArray.value,
      };

      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

      alert('Datos actualizados exitosamente.');

      await this.loadUserData();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      alert('Error al guardar datos. Intenta nuevamente.');
    }
  }

  get academicFormationArray(): FormArray {
    return this.profileForm.get('academicFormation') as FormArray;
  }

  addAcademicFormation(): void {
    const formationGroup = this.fb.group({
      year: ['', Validators.required],
      institution: ['', Validators.required],
      degree: ['', Validators.required],
    });
    this.academicFormationArray.push(formationGroup);
  }

  async removeAcademicFormation(index: number): Promise<void> {
    if (index < 0 || index >= this.academicFormationArray.length) {
      console.error('Índice inválido al intentar eliminar una formación académica.');
      return;
    }

    this.academicFormationArray.removeAt(index);

    if (this.userEmail) {
      try {
        const userData = await this.firebaseService.getUserData(this.userEmail);
        const currentProfileData = userData?.profileData || {};

        const updatedProfileData = {
          ...currentProfileData,
          academicFormation: this.academicFormationArray.value,
        };

        await this.firebaseService.updateUserData(this.userEmail, {
          profileData: updatedProfileData,
        });

        console.log('Formación académica eliminada y datos sincronizados con la base de datos.');
      } catch (error) {
        console.error('Error al sincronizar los datos con la base de datos:', error);
      }
    } else {
      console.error('Usuario no autenticado. No se puede actualizar la base de datos.');
    }
  }

  confirmDeleteAcademicFormation(index: number): void {
    this.academicFormationIndexToDelete = index;
    this.ConfirmationModalService.show(
      {
        title: 'Eliminar Formación Académica',
        message: '¿Estás seguro de que deseas eliminar esta formación académica?'
      },
      () => this.onDeleteConfirmed()
    );
  }

  onDeleteConfirmed(): void {
    if (this.academicFormationIndexToDelete !== null) {
      this.removeAcademicFormation(this.academicFormationIndexToDelete);
    }
    this.academicFormationIndexToDelete = null;
  }
}