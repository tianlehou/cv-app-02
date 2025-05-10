import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-candidate-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './candidate-register.component.html',
  styleUrls: ['./candidate-register.component.css'],
})
export class CandidateRegisterComponent implements OnInit {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  referredBy: string | null = null;
  @Output() showLogin = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private router: Router,
    public toastService: ToastService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      referredBy: [''],
    });
  }

  ngOnInit() {
    this.firebaseService.currentReferral.subscribe((ref) => {
      this.referredBy = ref;
      this.registerForm.patchValue({ referredBy: ref });
    });
  }

  onLoginClick() {
    this.showLogin.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async register() {
    if (this.registerForm.valid) {
      const { fullName, email, password, confirmPassword, referredBy } =
        this.registerForm.value;

      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        this.toastService.show('Las contraseñas no coinciden', 'error', 5000);
        return;
      }

      try {
        // 1. Registrar usuario en Firebase Auth
        await this.firebaseService.registerWithEmail(email, password);

        // 2. Preparar datos del usuario
        const userData = {
          email,
          role: 'candidate',
          enabled: true,
          createdAt: new Date().toISOString(),
          ...(referredBy && { referredBy }) // Solo añadir si existe referredBy
        };

        // 3. Guardar datos básicos (esto ahora maneja automáticamente los referidos)
        await this.firebaseService.saveUserData(email, userData);

        // 4. Guardar nombre completo
        await this.firebaseService.saveFullName(email, fullName);

        // 5. Si hay referido, mostrar mensaje especial
        if (referredBy) {
          this.toastService.show(
            `¡Registro exitoso! Has sido referido por ${referredBy}`,
            'success',
            5000
          );
        } else {
          this.toastService.show('Usuario registrado con éxito', 'success', 5000);
        }

        // Limpiar el referral después de registro exitoso
        this.firebaseService.clearReferralId();

        // Cambiar a vista de login después de 0.5 segundos
        setTimeout(() => {
          this.showLogin.emit();
        }, 500);
      } catch (error: any) {
        console.error(error);

        // Mapeo de errores de Firebase
        const errorMessages: { [key: string]: string } = {
          'auth/email-already-in-use': '¡Este correo ya está en uso!',
          'auth/invalid-email':
            'Correo inválido. Verifica que esté bien escrito.',
          'auth/weak-password':
            'Contraseña débil. Usa al menos 8 caracteres con letras y números.',
          'auth/network-request-failed':
            'Error de conexión. Verifica tu conexión a internet.',
        };

        const message =
          errorMessages[error.code as keyof typeof errorMessages] ||
          '¡Ocurrió un error inesperado durante el registro!';

        // Mostrar mensaje de error con toast
        this.toastService.show(message, 'error', 5000);
      }
    } else {
      // Mostrar error de validación de formulario
      this.toastService.show(
        'Por favor completa todos los campos requeridos correctamente',
        'error',
        5000
      );
    }
  }
}
