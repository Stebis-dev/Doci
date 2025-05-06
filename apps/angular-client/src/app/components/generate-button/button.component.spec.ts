import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { DescriptionGenerationService } from '../../service/description-generation/description-generation.service';
import { IconComponent } from '../icon.component';
import { Observable, of, throwError, Subscriber } from 'rxjs';

describe('ButtonComponent', () => {
    let component: ButtonComponent;
    let fixture: ComponentFixture<ButtonComponent>;
    let descriptionGenerationService: jest.Mocked<DescriptionGenerationService>;

    beforeEach(async () => {
        // Create mock service
        descriptionGenerationService = {
            generateComment: jest.fn()
        } as unknown as jest.Mocked<DescriptionGenerationService>;

        await TestBed.configureTestingModule({
            imports: [ButtonComponent, IconComponent],
            providers: [
                { provide: DescriptionGenerationService, useValue: descriptionGenerationService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.entityUuid).toBeNull();
        expect(component.isLoading()).toBeFalsy();
    });

    describe('generateDescription', () => {
        beforeEach(() => {
            // Reset loading state before each test
            component['_isLoading'] = false;
        });

        it('should not call service if entityUuid is null', () => {
            component.entityUuid = null;
            component.generateDescription();
            expect(descriptionGenerationService.generateComment).not.toHaveBeenCalled();
            expect(component.isLoading()).toBeFalsy();
        });

        it('should generate description successfully', () => {
            // Arrange
            const mockUuid = 'test-uuid';
            const mockResponse = { documentation: 'Generated description' };
            const emitSpy = jest.spyOn(component.description, 'emit');

            component.entityUuid = mockUuid;
            descriptionGenerationService.generateComment.mockReturnValue(of(mockResponse));

            // Act
            component.generateDescription();

            // Assert
            expect(descriptionGenerationService.generateComment).toHaveBeenCalledWith(mockUuid);
            expect(emitSpy).toHaveBeenCalledWith(mockResponse.documentation);
            expect(component.isLoading()).toBeFalsy();
        });

        it('should handle error during description generation', () => {
            // Arrange
            const mockUuid = 'test-uuid';
            const mockError = new Error('Generation failed');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const emitSpy = jest.spyOn(component.description, 'emit');

            component.entityUuid = mockUuid;
            descriptionGenerationService.generateComment.mockReturnValue(throwError(() => mockError));

            // Act
            component.generateDescription();

            // Assert
            expect(descriptionGenerationService.generateComment).toHaveBeenCalledWith(mockUuid);
            expect(consoleSpy).toHaveBeenCalledWith('Error generating description:', mockError);
            expect(emitSpy).not.toHaveBeenCalled();
            expect(component.isLoading()).toBeFalsy();

            consoleSpy.mockRestore();
        });

        it('should set loading state during generation', () => {
            // Arrange
            const mockUuid = 'test-uuid';
            component.entityUuid = mockUuid;

            // Mock service to not resolve immediately
            descriptionGenerationService.generateComment.mockReturnValue(new Observable((subscriber: Subscriber<any>) => {
                expect(component.isLoading()).toBeTruthy(); // Should be loading at this point
                subscriber.next({ documentation: 'test' });
                subscriber.complete();
            }));

            // Act
            component.generateDescription();

            // Assert
            expect(component.isLoading()).toBeFalsy(); // Should not be loading after completion
        });
    });

    describe('isLoading', () => {
        it('should return current loading state', () => {
            expect(component.isLoading()).toBeFalsy();
            component['_isLoading'] = true;
            expect(component.isLoading()).toBeTruthy();
        });
    });
}); 