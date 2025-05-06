import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnumMemberListComponent } from './enum-member-list.component';
import { EnumMember, NodePosition } from '@doci/shared';

describe('EnumMemberListComponent', () => {
    let component: EnumMemberListComponent;
    let fixture: ComponentFixture<EnumMemberListComponent>;

    const mockPosition: NodePosition = {
        row: 0,
        column: 0
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EnumMemberListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(EnumMemberListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.propertyLabel).toBe('Members');
        expect(component.members).toEqual([]);
    });

    describe('showMembers', () => {
        it('should return false when members is undefined', () => {
            component.members = undefined;
            expect(component.showMembers()).toBeFalsy();
        });

        it('should return false when members array is empty', () => {
            component.members = [];
            expect(component.showMembers()).toBeFalsy();
        });

        it('should return true when members array has items', () => {
            const mockMember: EnumMember = {
                member: 'TEST_MEMBER',
                value: '0'
            };
            component.members = [mockMember];
            expect(component.showMembers()).toBeTruthy();
        });
    });

    describe('Input properties', () => {
        it('should allow setting custom propertyLabel', () => {
            const customLabel = 'Custom Members';
            component.propertyLabel = customLabel;
            expect(component.propertyLabel).toBe(customLabel);
        });

        it('should allow setting members array', () => {
            const mockMembers: EnumMember[] = [
                {
                    member: 'MEMBER_ONE',
                    value: '1'
                },
                {
                    member: 'MEMBER_TWO',
                    value: '2'
                }
            ];
            component.members = mockMembers;
            expect(component.members).toEqual(mockMembers);
        });
    });
}); 