import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { User } from '@angular/fire/auth';
import { SkillsInfoComponent } from './skills-info/skills-info.component';
import { ToastService } from 'src/app/shared/services/toast.service';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';

@Component({
  selector: 'app-edit-skills',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SkillsInfoComponent,
    CvEditButtonRowComponent,
  ],
  templateUrl: './edit-skills.component.html',
  styleUrls: ['./edit-skills.component.css'],
})
export class EditSkillsComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = { skills: false };
  formHasChanges: boolean = false;
  private initialFormValue: any;
  private formSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser?.email) {
      this.userEmail = this.currentUser.email.replace(/\./g, '_');
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      skills: this.fb.array([this.createSkillGroup()])
    });
  }

  private createSkillGroup() {
    return this.fb.group({
      hardSkills: ['', Validators.required],
      softSkills: [''],
      languages: [''],
      certification: ['']
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const skillsData = userData?.profileData?.skills;

      if (skillsData && skillsData.length > 0) {
        this.populateSkills(skillsData);
      } else {
        this.skillsArray.clear();
        this.skillsArray.push(this.createSkillGroup());
      }

      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
    } catch (error) {
      console.error('Error loading skills:', error);
      this.toastService.show('Error al cargar las habilidades', 'error');
    }
  }

  private populateSkills(skills: any[]): void {
    const formArray = this.skillsArray;
    formArray.clear();

    skills.forEach(skill => {
      formArray.push(this.fb.group({
        hardSkills: [skill.hardSkills || '', Validators.required],
        softSkills: [skill.softSkills || ''],
        languages: [skill.languages || ''],
        certification: [skill.certification || '']
      }));
    });

    if (skills.length === 0) {
      formArray.push(this.createSkillGroup());
    }
  }

  toggleEdit(field: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const wasEditing = this.editableFields[field];
    this.editableFields[field] = !this.editableFields[field];

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }

    if (!wasEditing) {
      this.toastService.show('Modo edición habilitado', 'info');
      this.initialFormValue = JSON.parse(
        JSON.stringify(this.profileForm.getRawValue())
      );
      this.formHasChanges = false;

      this.formSubscription = this.profileForm.valueChanges.subscribe(() => {
        this.formHasChanges = !this.areObjectsEqual(
          this.initialFormValue,
          this.profileForm.getRawValue()
        );
      });
    } else {
      this.onSubmit().then(() => {
        this.toastService.show('Datos actualizados exitosamente', 'success');
      });
    }
  }

  private areObjectsEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  async onSubmit(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
    }
    if (!this.profileForm.valid || !this.userEmail) {
      this.toastService.show('Debes completar los campos requeridos.', 'error');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const currentProfileData = userData?.profileData || {};

      const updatedProfileData = {
        ...currentProfileData,
        skills: this.skillsArray.value,
      };

      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

      await this.loadUserData();
      this.editableFields['skills'] = false;
    } catch (error) {
      console.error('Error al actualizar las habilidades:', error);
      this.toastService.show(
        'Error al guardar los datos. Por favor, inténtalo nuevamente.',
        'error'
      );
    }
  }

  get skillsArray(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  addSkillGroup(): void {
    const skillGroup = this.createSkillGroup();
    this.skillsArray.push(skillGroup);
    this.toastService.show(
      'Se ha agregado un nuevo grupo de habilidades',
      'success'
    );
  }

  onCancel(): void {
    this.editableFields['skills'] = false;
    this.loadUserData();
    this.formHasChanges = false;

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }
    this.toastService.show('Modo edición deshabilitado', 'info');
  }
}