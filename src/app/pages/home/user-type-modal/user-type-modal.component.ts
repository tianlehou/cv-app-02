import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-type-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-type-modal.component.html',
  styleUrls: ['./user-type-modal.component.css']
})
export class UserTypeModalComponent {
  isVisible = false;
  @Output() userTypeSelected = new EventEmitter<'candidate' | 'company'>();

  openModal() {
    this.isVisible = true;
  }

  closeModal() {
    this.isVisible = false;
  }

  selectUserType(type: 'candidate' | 'company') {
    this.userTypeSelected.emit(type);
    this.closeModal();
    setTimeout(() => { // ← Añade este timeout
      document.body.classList.remove('modal-open');
      const backdrops = document.getElementsByClassName('modal-backdrop');
      while (backdrops.length > 0) {
        backdrops[0].remove();
      }
    }, 100);
  }
}