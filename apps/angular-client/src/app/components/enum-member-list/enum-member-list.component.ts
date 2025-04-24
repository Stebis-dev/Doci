import { Component, Input } from '@angular/core';
import { EnumMember } from '@doci/shared';

@Component({
    selector: 'app-enum-member-list',
    templateUrl: './enum-member-list.component.html'
})
export class EnumMemberListComponent {

    @Input() propertyLabel = 'Members';
    @Input() members: EnumMember[] | undefined = [];

    showMembers(): boolean {
        return this.members !== undefined && this.members.length > 0;
    }
} 