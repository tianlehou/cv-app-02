import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { RouterModule, Router } from '@angular/router';
import { GoogleLoginComponent } from '../google-login-button/google-login.component';

@Component({
  selector: 'app-candidate-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, GoogleLoginComponent],
  templateUrl: './candidate-login.component.html',
  styleUrls: ['./candidate-login.component.css'],
})
export class CandidateLoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  successMessage: string | null = null; // Mensaje de éxito
  emailErrorMessage: string | null = null; // Mensaje de error para el correo
  passwordErrorMessage: string | null = null; // Mensaje de error para la contraseña
  @Output() showRegister = new EventEmitter<void>();
  @Output() showForgotPassword = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Métodos para manejar los clicks
  onRegisterClick() {
    this.showRegister.emit();
  }

  onForgotPasswordClick() {
    this.showForgotPassword.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    const { email, password } = this.loginForm.value;

    // Limpiar mensajes anteriores
    this.successMessage = null;
    this.emailErrorMessage = null;
    this.passwordErrorMessage = null;

    if (this.loginForm.valid) {
      this.firebaseService
        .loginWithEmail(email, password)
        .then((user) => {
          // Actualizar último acceso
          this.firebaseService.updateUserData(user.email, {
            lastLogin: new Date().toISOString(),
          });

          this.successMessage = 'Inicio de sesión exitoso';
          setTimeout(() => {
            if (user?.role === 'admin') {
              this.router.navigate(['/main']);
            } else {
              this.router.navigate(['/principal']);
            }
          }, 3000);
        })
        .catch((error: { code: string }) => {
          console.error(error);

          // Mapeo de errores de Firebase
          const errorMessages: { [key: string]: string } = {
            'auth/invalid-email':
              'Correo inválido. Verifica que esté bien escrito.',
            'auth/user-disabled': 'Tu cuenta ha sido deshabilitada.',
            'auth/user-not-found': 'No se encontró una cuenta con este correo.',
            'auth/wrong-password': 'Contraseña incorrecta.',
          };

          // Obtener el mensaje de error específico o uno genérico
          const message =
            errorMessages[error.code as keyof typeof errorMessages] ||
            '¡Ocurrió un error inesperado!';

          // Asignar el mensaje de error al campo correspondiente
          if (
            error.code === 'auth/invalid-email' ||
            error.code === 'auth/user-not-found'
          ) {
            this.emailErrorMessage = message;
          } else if (error.code === 'auth/wrong-password') {
            this.passwordErrorMessage = message;
          } else {
            this.emailErrorMessage = message; // Mensaje genérico para otros errores
          }
        });
    }
  }

  handleGoogleSuccess() {
    this.successMessage = 'Autenticación con Google exitosa';
    setTimeout(() => {
      this.router.navigate(['/profile']);
    }, 2000);
  }

  handleGoogleError(message: string) {
    this.emailErrorMessage = message;
  }
}
