import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyListComponent } from './property-list.component';
import { PropertyDetail, NodePosition } from '@doci/shared';

describe('PropertyListComponent', () => {
    let component: PropertyListComponent;
    let fixture: ComponentFixture<PropertyListComponent>;

    const mockPosition: NodePosition = {
        row: 0,
        column: 0
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PropertyListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PropertyListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.propertyLabel).toBe('Properties');
        expect(component.properties).toEqual([]);
    });

    describe('showProperties', () => {
        it('should return false when properties is undefined', () => {
            component.properties = undefined;
            expect(component.showProperties()).toBeFalsy();
        });

        it('should return false when properties array is empty', () => {
            component.properties = [];
            expect(component.showProperties()).toBeFalsy();
        });

        it('should return true when properties array has items', () => {
            component.properties = [{
                name: 'testProperty',
                modifiers: [],
                genericName: '',
                predefinedType: [],
                objectType: [],
                startPosition: mockPosition,
                endPosition: mockPosition
            }];
            expect(component.showProperties()).toBeTruthy();
        });
    });

    describe('getPropertyType', () => {
        it('should return empty string when property is undefined', () => {
            expect(component.getPropertyType(undefined as unknown as PropertyDetail)).toBe('');
        });

        it('should handle property with only predefined type', () => {
            const property: PropertyDetail = {
                name: 'test',
                modifiers: [],
                predefinedType: ['string'],
                objectType: [],
                genericName: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getPropertyType(property)).toBe('string');
        });

        it('should handle property with only object type', () => {
            const property: PropertyDetail = {
                name: 'test',
                modifiers: [],
                predefinedType: [],
                objectType: ['User'],
                genericName: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getPropertyType(property)).toBe('User');
        });

        it('should handle property with generic type', () => {
            const property: PropertyDetail = {
                name: 'test',
                modifiers: [],
                predefinedType: [],
                objectType: ['User'],
                genericName: 'Array',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getPropertyType(property)).toBe('Array<User>');
        });

        it('should handle property with combined types', () => {
            const property: PropertyDetail = {
                name: 'test',
                modifiers: [],
                predefinedType: ['Array'],
                objectType: ['string'],
                genericName: 'Observable',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getPropertyType(property)).toBe('Observable<Arraystring>');
        });

        it('should handle property with multiple object types', () => {
            const property: PropertyDetail = {
                name: 'test',
                modifiers: [],
                predefinedType: [],
                objectType: ['User', 'Admin'],
                genericName: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getPropertyType(property)).toBe('UserAdmin');
        });

        it('should handle property with multiple predefined types', () => {
            const property: PropertyDetail = {
                name: 'test',
                modifiers: [],
                predefinedType: ['string', 'number'],
                objectType: [],
                genericName: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getPropertyType(property)).toBe('stringnumber');
        });
    });
}); 