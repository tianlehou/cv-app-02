import { Component, Output, EventEmitter, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-me-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-me-info.component.html',
  styleUrls: ['./about-me-info.component.css']
})
export class AboutMeInfoComponent implements AfterViewInit {
  @Output() back = new EventEmitter<void>();
  @ViewChild('infoContainer') infoContainer!: ElementRef;
  showBackToTop = false;

  ngAfterViewInit() {
    this.checkScrollPosition();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.checkScrollPosition();
  }

  checkScrollPosition() {
    if (this.infoContainer) {
      const container = this.infoContainer.nativeElement;
      const containerRect = container.getBoundingClientRect();
      const containerBottom = containerRect.bottom;
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY || window.pageYOffset;

      // Mostrar el botón cuando el usuario haya llegado al final del componente
      const componentHeight = containerRect.height;
      const triggerPoint = componentHeight * 0.7; // Mostrar después del 70% del componente
      
      this.showBackToTop = containerBottom <= windowHeight + 100;
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  goBack(): void {
    this.back.emit();
  }
}