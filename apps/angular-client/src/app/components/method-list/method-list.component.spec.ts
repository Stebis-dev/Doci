import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MethodListComponent } from './method-list.component';
import { MethodDetail, ParameterDetail, NodePosition } from '@doci/shared';

describe('MethodListComponent', () => {
    let component: MethodListComponent;
    let fixture: ComponentFixture<MethodListComponent>;

    const mockPosition: NodePosition = {
        row: 0,
        column: 0
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MethodListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(MethodListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.methodLabel).toBe('Methods');
        expect(component.methods).toEqual([]);
    });

    describe('showMethods', () => {
        it('should return false when methods is undefined', () => {
            component.methods = undefined;
            expect(component.showMethods()).toBeFalsy();
        });

        it('should return false when methods array is empty', () => {
            component.methods = [];
            expect(component.showMethods()).toBeFalsy();
        });

        it('should return true when methods array has items', () => {
            component.methods = [{
                name: 'testMethod',
                uuid: 'test-uuid',
                modifiers: [],
                parameters: [],
                body: '',
                genericName: '',
                predefinedType: [],
                objectType: [],
                startPosition: mockPosition,
                endPosition: mockPosition
            }];
            expect(component.showMethods()).toBeTruthy();
        });
    });

    describe('getReturnType', () => {
        it('should return empty string when method is undefined', () => {
            expect(component.getReturnType(undefined as unknown as MethodDetail)).toBe('');
        });

        it('should handle method with only predefined type', () => {
            const method: MethodDetail = {
                name: 'test',
                uuid: 'test-uuid',
                modifiers: [],
                parameters: [],
                body: '',
                predefinedType: ['string'],
                objectType: [],
                genericName: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getReturnType(method)).toBe('string');
        });

        it('should handle method with only object type', () => {
            const method: MethodDetail = {
                name: 'test',
                uuid: 'test-uuid',
                modifiers: [],
                parameters: [],
                body: '',
                predefinedType: [],
                objectType: ['User'],
                genericName: '',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getReturnType(method)).toBe('User');
        });

        it('should handle method with generic type', () => {
            const method: MethodDetail = {
                name: 'test',
                uuid: 'test-uuid',
                modifiers: [],
                parameters: [],
                body: '',
                predefinedType: [],
                objectType: ['User'],
                genericName: 'Promise',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getReturnType(method)).toBe('Promise<User>');
        });

        it('should handle method with combined types', () => {
            const method: MethodDetail = {
                name: 'test',
                uuid: 'test-uuid',
                modifiers: [],
                parameters: [],
                body: '',
                predefinedType: ['Array'],
                objectType: ['string'],
                genericName: 'Observable',
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getReturnType(method)).toBe('Observable<Arraystring>');
        });
    });

    describe('getMethodName', () => {
        it('should return empty string when method is undefined', () => {
            expect(component.getMethodName(undefined as unknown as MethodDetail)).toBe('');
        });

        it('should format method name without parameters', () => {
            const method: MethodDetail = {
                name: 'testMethod',
                uuid: 'test-uuid',
                modifiers: [],
                parameters: [],
                body: '',
                genericName: '',
                predefinedType: [],
                objectType: [],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getMethodName(method)).toBe('testMethod()');
        });

        it('should format method name with parameters', () => {
            const parameters: ParameterDetail[] = [
                {
                    name: 'userId',
                    varName: ['userId'],
                    genericName: [],
                    objectType: ['string'],
                    startPosition: mockPosition,
                    endPosition: mockPosition
                }
            ];
            const method: MethodDetail = {
                name: 'getUser',
                uuid: 'test-uuid',
                modifiers: [],
                parameters,
                body: '',
                genericName: '',
                predefinedType: [],
                objectType: [],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getMethodName(method)).toBe('getUser(string userId)');
        });

        it('should format method name with multiple parameters', () => {
            const parameters: ParameterDetail[] = [
                {
                    name: 'userId',
                    varName: ['userId'],
                    genericName: [],
                    objectType: ['string'],
                    startPosition: mockPosition,
                    endPosition: mockPosition
                },
                {
                    name: 'age',
                    varName: ['age'],
                    genericName: [],
                    objectType: ['number'],
                    startPosition: mockPosition,
                    endPosition: mockPosition
                }
            ];
            const method: MethodDetail = {
                name: 'updateUser',
                uuid: 'test-uuid',
                modifiers: [],
                parameters,
                body: '',
                genericName: '',
                predefinedType: [],
                objectType: [],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getMethodName(method)).toBe('updateUser(string userId, number age)');
        });
    });

    describe('getParameter', () => {
        it('should format simple parameter', () => {
            const parameter: ParameterDetail = {
                name: 'name',
                varName: ['name'],
                genericName: [],
                objectType: ['string'],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getParameter(parameter)).toBe('string name');
        });

        it('should format generic parameter', () => {
            const parameter: ParameterDetail = {
                name: 'users',
                varName: ['users'],
                genericName: ['Array'],
                objectType: ['User'],
                startPosition: mockPosition,
                endPosition: mockPosition
            };
            expect(component.getParameter(parameter)).toBe('Array<User> users');
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