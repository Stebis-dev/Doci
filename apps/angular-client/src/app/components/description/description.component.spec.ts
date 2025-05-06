import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DescriptionComponent } from './description.component';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../generate-button/button.component';

describe('DescriptionComponent', () => {
    let component: DescriptionComponent;
    let fixture: ComponentFixture<DescriptionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, ButtonComponent],
            declarations: []
        }).compileComponents();

        fixture = TestBed.createComponent(DescriptionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('initialization', () => {
        it('should initialize with default values', () => {
            expect(component.description).toBeNull();
            expect(component.entityUuid).toBeNull();
            expect(component.isEditing).toBeFalsy();
            expect(component.entityName).toBeNull();
            expect(component.editedDescription).toBe('');
            expect(component.generatedDescription).toBeNull();
        });

        it('should set editedDescription on ngOnInit', () => {
            component.description = 'Test Description';
            component.ngOnInit();
            expect(component.editedDescription).toBe('Test Description');
        });
    });

    describe('ngOnChanges', () => {
        it('should update editedDescription when description changes', () => {
            component.description = 'Old Description';
            const changes = {
                description: {
                    currentValue: 'New Description',
                    previousValue: 'Old Description',
                    firstChange: false,
                    isFirstChange: () => false
                }
            };
            component.ngOnChanges(changes);
            component.editedDescription = changes.description.currentValue;
            expect(component.editedDescription).toBe('New Description');
        });
    });

    describe('editing functions', () => {
        it('should handle onEdit correctly', () => {
            component.description = 'Test Description';
            component.onEdit();
            expect(component.isEditing).toBeTruthy();
            expect(component.editedDescription).toBe('Test Description');
        });

        it('should handle onCancel correctly', () => {
            const cancelSpy = jest.spyOn(component.cancelEdit, 'emit');
            component.description = 'Test Description';
            component.editedDescription = 'Changed Description';
            component.isEditing = true;

            component.onCancel();

            expect(component.isEditing).toBeFalsy();
            expect(component.editedDescription).toBe('Test Description');
            expect(cancelSpy).toHaveBeenCalled();
        });

        it('should handle onSave correctly', () => {
            const saveSpy = jest.spyOn(component.saveDescription, 'emit');
            component.editedDescription = 'New Description';
            component.isEditing = true;

            component.onSave();

            expect(component.isEditing).toBeFalsy();
            expect(saveSpy).toHaveBeenCalledWith('New Description');
        });

        it('should not emit save event if editedDescription is empty', () => {
            const saveSpy = jest.spyOn(component.saveDescription, 'emit');
            component.editedDescription = '';
            component.isEditing = true;

            component.onSave();

            expect(component.isEditing).toBeFalsy();
            expect(saveSpy).not.toHaveBeenCalled();
        });
    });

    describe('description generation', () => {
        it('should handle onDescriptionGenerated correctly', () => {
            const generatedText = 'Generated Description';
            component.onDescriptionGenerated(generatedText);

            expect(component.generatedDescription).toBe(generatedText);
            expect(component.editedDescription).toBe(generatedText);
        });
    });

    describe('utility functions', () => {
        it('should correctly determine if description exists', () => {
            component.description = null;
            expect(component.hasDescription()).toBeFalsy();

            component.description = '';
            expect(component.hasDescription()).toBeFalsy();

            component.description = '   ';
            expect(component.hasDescription()).toBeFalsy();

            component.description = 'Valid Description';
            expect(component.hasDescription()).toBeTruthy();
        });

        it('should return correct button text based on description state', () => {
            component.description = null;
            expect(component.getButtonText()).toBe('Add');

            component.description = '';
            expect(component.getButtonText()).toBe('Add');

            component.description = 'Valid Description';
            expect(component.getButtonText()).toBe('Edit');
        });
    });
}); 