import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon.component';
import { DescriptionGenerationService } from '../../service/description-generation/description-generation.service';

@Component({
    selector: 'app-generate-comments-button',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './button.component.html',
})
export class ButtonComponent implements OnInit {

    @Input() entityUuid: string | null = null;
    @Output() description = new EventEmitter<string>();

    private _isLoading: boolean;

    constructor(private readonly descriptionGenerationService: DescriptionGenerationService) {
        this._isLoading = false;
    }

    ngOnInit() {
        this._isLoading = false;
        console.log('ButtonComponent initialized with entityUuid:', this.entityUuid);
    }

    generateDescription() {
        console.log('Generate description button clicked for entityUuid:', this.entityUuid);
        if (this.entityUuid) {
            this._isLoading = true;

            this.descriptionGenerationService.generateComment(this.entityUuid).subscribe({
                next: (response) => {
                    console.log('Generated:', response.documentation);
                    this.description.emit(response.documentation);
                    this._isLoading = false;
                },
                error: (error) => {
                    console.error('Error generating description:', error);
                    this._isLoading = false;
                }
            });
        }
    }

    isLoading(): boolean {
        return this._isLoading;
    }
}