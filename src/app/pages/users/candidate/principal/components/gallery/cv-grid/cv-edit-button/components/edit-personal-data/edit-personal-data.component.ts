import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-personal-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-personal-data.component.html',
  styleUrls: ['./edit-personal-data.component.css'],
})
export class EditPersonalDataComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  editableFields: { [key: string]: boolean } = {};

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();
    if (this.currentUser) {
      this.loadUserData();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      profesion: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^\d{4}-\d{4}$/)]],
      editableEmail: ['', [Validators.required, Validators.email]],
      direction: [''],
    });
  }

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/-/g, '');
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    input.value = value;
  }

  private setEditableFields(): void {
    this.editableFields = {
      fullName: false,
      profesion: false,
      phone: false,
      editableEmail: false,
      direction: false,
    };
  }

  private async loadUserData(): Promise<void> {
    if (!this.currentUser?.email) return;

    try {
      const userEmailKey = this.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(userEmailKey);
      
      this.profileForm.patchValue({
        fullName: userData?.fullName || '',
        profesion: userData?.profileData?.personalData?.profesion || '',
        phone: userData?.profileData?.personalData?.phone || '',
        editableEmail: userData?.profileData?.personalData?.editableEmail || '',
        direction: userData?.profileData?.personalData?.direction || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  toggleEdit(field: string): void {
    this.editableFields[field] = !this.editableFields[field];
    
    if (!this.editableFields[field]) {
      // Validar solo el campo actual antes de guardar
      const control = this.profileForm.get(field);
      if (control?.invalid) {
        alert(`Por favor complete el campo ${field} correctamente.`);
        this.editableFields[field] = true; // Mantener en modo edición
        return;
      }
      this.onSubmit(field); // Pasar el campo específico a onSubmit
    }
  }

  async onSubmit(field?: string): Promise<void> {
    if (!this.currentUser?.email) {
      alert('Usuario no autenticado.');
      return;
    }
  
    try {
      const userEmailKey = this.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(userEmailKey);
      
      // Actualizar solo los datos necesarios
      const updatedData: any = {
        profileData: {
          ...userData?.profileData,
          personalData: {
            ...userData?.profileData?.personalData
          }
        }
      };
  
      // Si es un campo específico, actualizar solo ese campo
      if (field) {
        if (field === 'fullName') {
          updatedData.fullName = this.profileForm.value.fullName;
        } else {
          updatedData.profileData.personalData[field] = this.profileForm.value[field];
        }
      } else {
        // Actualizar todos los campos (para cuando se necesite)
        updatedData.fullName = this.profileForm.value.fullName;
        updatedData.profileData.personalData = {
          ...updatedData.profileData.personalData,
          ...this.profileForm.value
        };
      }
  
      await this.firebaseService.updateUserData(this.currentUser.email, updatedData);
      
      if (field) {
        alert(`Campo ${field} actualizado exitosamente!`);
      } else {
        alert('Datos actualizados exitosamente!');
      }
      
      await this.loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar los datos');
    }
  }
}