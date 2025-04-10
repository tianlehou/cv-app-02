import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-profile-picture',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile-picture.component.html',
  styleUrls: ['./edit-profile-picture.component.css'],
})
export class EditProfilePictureComponent implements OnInit, OnChanges {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private storage: Storage,
    private firebaseService: FirebaseService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUser'] && this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserData();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserData();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      profilePicture: [''],
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmailKey) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey);

      if (userData?.profileData?.multimedia?.picture?.profilePicture) {
        const timestamp = new Date().getTime();
        const imageUrl = `${userData.profileData.multimedia.picture.profilePicture}?${timestamp}`;
        this.profileForm.patchValue({ profilePicture: imageUrl });
      } else {
        this.profileForm.patchValue({ profilePicture: '' });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('No se pudo cargar la imagen actual');
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profileForm.patchValue({ profilePicture: reader.result });
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.profileForm.patchValue({ profilePicture: '' });
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedFile) {
      alert('Selecciona una imagen válida');
      return;
    }
    if (!this.userEmailKey || !this.currentUser?.email) {
      alert('Debes iniciar sesión para guardar cambios');
      return;
    }

    try {
      const PROFILE_PIC_NAME = 'profile-picture.jpg';
      const storageRef = ref(
        this.storage,
        `cv-app/users/${this.userEmailKey}/profile-pictures/${PROFILE_PIC_NAME}`
      );

      // 1. Eliminar la imagen anterior si existe
      try {
        await deleteObject(storageRef);
        console.log('Imagen anterior eliminada correctamente');
      } catch (deleteError) {
        console.log('No existía imagen previa o error al eliminar:', deleteError);
      }

      // 2. Subir la nueva imagen
      await uploadBytes(storageRef, this.selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // 3. Obtener datos actuales del usuario
      const userData = await this.firebaseService.getUserData(this.userEmailKey);
      
      // 4. Crear objeto actualizado manteniendo todos los datos existentes
      const updatedData = {
        profileData: {
          ...userData?.profileData || {}, // Mantener todos los datos existentes
          multimedia: {
            ...userData?.profileData?.multimedia || {},
            picture: {
              ...userData?.profileData?.multimedia?.picture || {},
              profilePicture: downloadURL // Solo actualizar este campo
            }
          }
        }
      };

      // 5. Actualizar en Firebase
      await this.firebaseService.updateUserData(this.currentUser.email, updatedData);

      alert('¡Foto actualizada correctamente!');
      await this.loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert(
        `Error al guardar: ${
          error instanceof Error ? error.message : 'Intenta nuevamente'
        }`
      );
    }
  }
}