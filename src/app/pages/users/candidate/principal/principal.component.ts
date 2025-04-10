import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../shared/services/firebase.service';

// Custom components
import { SidebarComponent } from '../../../../shared/components/buttons/sidebar/sidebar.component';

// Components
import { ProfilePictureComponent } from './components/profile-picture/profile-picture.component';
import { PersonalDataComponent } from './components/personal-data/personal-data.component';
import { GalleryComponent } from './components/gallery/gallery.component';
@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    SidebarComponent,
    ProfilePictureComponent,
    PersonalDataComponent,
    GalleryComponent
  ],
  templateUrl: './principal.component.html',
  styleUrls: [
    './principal.component.css',
    './back-to-top.component.css',
    '../../../../shared/components/buttons/custom-button/custom-button.component.css',
  ],
})
export class PrincipalComponent implements OnInit, AfterViewInit {
  currentUser: any = null;
  userRole: string | null = null;
  @ViewChild('profileContainer') profileContainer!: ElementRef;
  showBackToTop = false;

  constructor(private firebaseService: FirebaseService) {} // Inyecta el servicio

  async ngOnInit(): Promise<void> {

    // Usa el método del servicio para obtener el estado de autenticación
    this.firebaseService
      .isAuthenticated()
      .subscribe(async (isAuthenticated) => {
        if (isAuthenticated) {
          this.currentUser = await this.firebaseService.getCurrentUser();
          console.log('Usuario autenticado:', this.currentUser.email);

          // Obtener el rol usando firebase.service
          const userData = await this.firebaseService.getUserData(
            this.currentUser.email.replace(/\./g, '_')
          );
          this.userRole = userData?.role || null;
          console.log('Rol del usuario:', this.userRole);
        } else {
          console.error('Usuario no autenticado.');
        }
      });
  }

  // Usa el método del servicio para obtener el estado de autenticación
  ngAfterViewInit() {
    this.checkScrollPosition();
  }

  // Escucha el evento de scroll de la ventana
  @HostListener('window:scroll') // Escucha el evento de scroll
  onWindowScroll() { // Escucha el evento de scroll
    this.checkScrollPosition(); // Llama a la función para verificar la posición del scroll
  }

  // Función para verificar la posición del scroll
  checkScrollPosition() { // Verifica la posición del scroll
    if (this.profileContainer) { // Verifica si el contenedor está definido
      const container = this.profileContainer.nativeElement; // Obtiene el elemento del contenedor
      const containerRect = container.getBoundingClientRect(); // Obtiene el rectángulo delimitador del contenedor
      const containerBottom = containerRect.bottom; // Obtiene la posición inferior del contenedor
      const windowHeight = window.innerHeight; // Obtiene la altura de la ventana
      const scrollPosition = window.scrollY || window.pageYOffset; // Obtiene la posición del scroll

      // Mostrar el botón cuando el usuario haya llegado al final del componente
      const componentHeight = containerRect.height; // Altura del componente
      const triggerPoint = componentHeight * 0.7; // Mostrar después del 70% del componente
      // Si el scroll está en la parte superior del componente, no mostrar el botón
      this.showBackToTop = containerBottom <= windowHeight + 100; // Mostrar el botón si el scroll está cerca del final del componente
    }
  }

  // Función para manejar el clic en el botón "Volver arriba"
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}