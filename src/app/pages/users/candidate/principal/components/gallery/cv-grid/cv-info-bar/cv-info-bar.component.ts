import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv-info-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-info-bar.component.html',
  styleUrls: ['./cv-info-bar.component.css']
})
export class CvInfoBarComponent {
  @Input() isLoading = false;
  @Input() userImages: string[] = [];
  isInfoModalVisible = false;

  showInfoModal(): void {
    this.isInfoModalVisible = true;
  }

  hideInfoModal(): void {
    this.isInfoModalVisible = false;
  }

  getImageCountText(): string {
    if (this.userImages.length === 0) return 'No hay imágenes cargadas.';
    return `(${this.userImages.length}) foto${this.userImages.length > 1 ? 's' : ''} cargado${this.userImages.length > 1 ? 's' : ''}`;
  }
}