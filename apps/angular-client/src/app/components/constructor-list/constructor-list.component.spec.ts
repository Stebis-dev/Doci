import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConstructorListComponent } from './constructor-list.component';
import { ConstructorMethodDetail, ParameterDetail, NodePosition } from '@doci/shared';

describe('ConstructorListComponent', () => {
    let component: ConstructorListComponent;
    let fixture: ComponentFixture<ConstructorListComponent>;

    const mockPosition: NodePosition = {
        row: 0,
        column: 0
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConstructorListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ConstructorListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.constructorLabel).toBe('Constructor');
        expect(component.constructors).toEqual([]);
    });

    describe('showConstructors', () => {
        it('should return false when constructors is undefined', () => {
            component.constructors = undefined;
            expect(component.showConstructors()).toBeFalsy();
        });

        it('should return false when constructors array is empty', () => {
            component.constructors = [];
            expect(component.showConstructors()).toBeFalsy();
        });

        it('should return true when constructors array has items', () => {
            component.constructors = [{
                name: 'constructor',
                parameters: [],
                modifiers: [],
                body: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            }];
            expect(component.showConstructors()).toBeTruthy();
        });
    });

    describe('getConstructorMethodName', () => {
        it('should return empty string when method is undefined', () => {
            expect(component.getConstructorMethodName(undefined as unknown as ConstructorMethodDetail)).toBe('');
        });

        it('should format constructor name without parameters', () => {
            const method: ConstructorMethodDetail = {
                name: 'constructor',
                parameters: [],
                modifiers: [],
                body: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getConstructorMethodName(method)).toBe('constructor()');
        });

        it('should format constructor name with single parameter', () => {
            const parameter: ParameterDetail = {
                name: 'service',
                varName: ['service'],
                genericName: [],
                objectType: ['TestService'],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            const method: ConstructorMethodDetail = {
                name: 'constructor',
                parameters: [parameter],
                modifiers: [],
                body: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getConstructorMethodName(method)).toBe('constructor(TestService service)');
        });

        it('should format constructor name with multiple parameters', () => {
            const parameters: ParameterDetail[] = [
                {
                    name: 'service1',
                    varName: ['service1'],
                    genericName: [],
                    objectType: ['TestService1'],
                    startPosition: mockPosition,
                    endPosition: mockPosition
                },
                {
                    name: 'service2',
                    varName: ['service2'],
                    genericName: [],
                    objectType: ['TestService2'],
                    startPosition: mockPosition,
                    endPosition: mockPosition
                }
            ];
            const method: ConstructorMethodDetail = {
                name: 'constructor',
                parameters,
                modifiers: [],
                body: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getConstructorMethodName(method))
                .toBe('constructor(TestService1 service1, TestService2 service2)');
        });
    });

    describe('getParameter', () => {
        it('should format simple parameter', () => {
            const parameter: ParameterDetail = {
                name: 'service',
                varName: ['service'],
                genericName: [],
                objectType: ['TestService'],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getParameter(parameter)).toBe('TestService service');
        });

        it('should format generic parameter', () => {
            const parameter: ParameterDetail = {
                name: 'items',
                varName: ['items'],
                genericName: ['Array'],
                objectType: ['Item'],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getParameter(parameter)).toBe('Array<Item> items');
        });

        it('should handle parameter with empty types', () => {
            const parameter: ParameterDetail = {
                name: 'data',
                varName: ['data'],
                genericName: [],
                objectType: [],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getParameter(parameter)).toBe(' data');
        });
    });
}); 