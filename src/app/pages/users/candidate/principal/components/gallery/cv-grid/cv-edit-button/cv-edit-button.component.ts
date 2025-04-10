import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, HostListener, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-cv-edit-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-edit-button.component.html',
  styleUrls: ['./cv-edit-button.component.css'],
})
export class CvEditButtonComponent {
  @Output() optionSelected = new EventEmitter<string>();
  showOptions = false;

  constructor(private cdr: ChangeDetectorRef) {}

  toggleOptions(event: Event) {
    event.stopPropagation();
    this.showOptions = !this.showOptions;
    this.cdr.detectChanges(); // Forzar actualización de vista
  }

  selectOption(option: string, event: Event) {
    event.stopPropagation(); // Detener propagación
    this.optionSelected.emit(option);
    this.closePopover();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showOptions) {
      this.closePopover();
    }
  }

  private closePopover() {
    this.showOptions = false;
    this.cdr.detectChanges(); // Forzar actualización de vista
  }
}