import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-business-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-filters.component.html',
  styleUrls: ['./business-filters.component.css']
})
export class BusinessFiltersComponent {
  @Input() userTypeFilter: string = 'all';
  @Input() searchQuery: string = '';
  
  @Output() filtersApplied = new EventEmitter<{
    userTypeFilter: string;
    searchQuery: string;
  }>();

  applyFilters() {
    this.filtersApplied.emit({
      userTypeFilter: this.userTypeFilter,
      searchQuery: this.searchQuery
    });
  }
}