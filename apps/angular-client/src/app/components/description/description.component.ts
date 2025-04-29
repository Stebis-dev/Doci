import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../generate-button/button.component';

@Component({
    selector: 'app-description',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    templateUrl: './description.component.html',
})
export class DescriptionComponent implements OnInit, OnChanges {
    @Input() description: string | null = null;
    @Input() entityUuid: string | null = null;
    @Input() isEditing = false;
    @Input() entityName: string | null = null;

    @Output() saveDescription = new EventEmitter<string>();
    @Output() cancelEdit = new EventEmitter<void>();

    editedDescription: string | null = null;
    generatedDescription: string | null = null;

    ngOnInit(): void {
        this.editedDescription = this.description || '';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['description']) {
            this.editedDescription = this.description || '';
        }
    }

    onEdit(): void {
        this.isEditing = true;
        this.editedDescription = this.description || '';
    }

    onCancel(): void {
        this.isEditing = false;
        this.editedDescription = this.description || '';
        this.cancelEdit.emit();
    }

    onSave(): void {
        this.isEditing = false;
        if (this.editedDescription) {
            this.saveDescription.emit(this.editedDescription);
        }
    }

    onDescriptionGenerated(description: string): void {
        this.generatedDescription = description;
        this.editedDescription = description;
    }

    hasDescription(): boolean {
        return !!this.description && this.description.trim() !== '';
    }

    getButtonText(): string {
        return this.hasDescription() ? 'Edit' : 'Add';
    }
} 
