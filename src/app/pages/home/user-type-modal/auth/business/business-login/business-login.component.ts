import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { AuthService } from '../../auth.service';
import { UserCredential } from '@angular/fire/auth';

@Component({
  selector: 'app-business-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './business-login.component.html',
  styleUrls: ['./business-login.component.css'],
})
export class BusinessLoginComponent {
  @Output() showBusinessRegister = new EventEmitter<void>();
  @Output() showBusinessForgotPassword = new EventEmitter<void>();
  @Output() showHome = new EventEmitter<void>();
  loginForm: FormGroup;
  showPassword = false;
  successMessage: string | null = null;
  emailErrorMessage: string | null = null;
  passwordErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onRegisterClick() {
    this.showBusinessRegister.emit();
  }

  onForgotPasswordClick() {
    this.showBusinessForgotPassword.emit();
  }

  goBackToHome() {
    this.showHome.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    const { email, password } = this.loginForm.value;

    // Limpiar mensajes anteriores
    this.successMessage = null;
    this.emailErrorMessage = null;
    this.passwordErrorMessage = null;

    if (this.loginForm.valid) {
      try {
        const userCredential: UserCredential = await this.authService.loginWithEmail(email, password);
        const user = userCredential.user;

        if (!user || !user.email) {
          throw new Error('No se pudo obtener información del usuario');
        }

        // Obtener datos del usuario desde Firebase
        const userData = await this.firebaseService.getCurrentUser();

        if (!userData) {
          throw new Error('No se encontraron datos del usuario');
        }

        // Actualizar último acceso
        await this.firebaseService.updateUserData(user.email, {
          metadata: {
            lastLogin: new Date().toISOString()
          }
        });

        this.successMessage = 'Inicio de sesión exitoso';

        setTimeout(() => {
          const role = userData.metadata?.role || 'business';
          if (role === 'admin') {
            this.router.navigate(['/main']);
          } else {
            this.router.navigate(['/business']);
          }
        }, 3000);
      } catch (error: any) {
        console.error(error);

        // Mapeo de errores de Firebase
        const errorMessages: { [key: string]: string } = {
          'auth/invalid-email': 'Correo inválido. Verifica que esté bien escrito.',
          'auth/user-disabled': 'Tu cuenta ha sido deshabilitada.',
          'auth/user-not-found': 'No se encontró una cuenta con este correo.',
          'auth/wrong-password': 'Contraseña incorrecta.',
        };

        const message = errorMessages[error.code] || '¡Ocurrió un error inesperado!';

        if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found') {
          this.emailErrorMessage = message;
        } else if (error.code === 'auth/wrong-password') {
          this.passwordErrorMessage = message;
        } else {
          this.emailErrorMessage = message;
        }
      }
    }
  }
}