import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassDetail, ConstructorMethodDetail, EnumDetail, ExtractorType, MethodDetail, ProjectFile, PropertyDetail } from '@doci/shared';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import mermaid from 'mermaid';
import { MermaidService } from '../../service/mermaid/mermaid.service';
import { MethodListComponent } from '../method-list/method-list.component';
import { PropertyListComponent } from '../property-list/property-list.component';
import { ConstructorListComponent } from '../constructor-list/constructor-list.component';
import { EnumMemberListComponent } from '../enum-member-list/enum-member-list.component';

@Component({
    selector: 'app-file-details',
    standalone: true,
    imports: [CommonModule, MethodListComponent, PropertyListComponent, ConstructorListComponent, EnumMemberListComponent],
    templateUrl: './file-details.component.html',
    styleUrls: ['./file-details.component.css']
})
export class FileDetailsComponent implements OnInit, OnChanges, AfterViewInit {

    @Input() file: ProjectFile | null = null;
    classes?: ClassDetail[] = [];
    enums?: EnumDetail[] = [];
    constructors?: ConstructorMethodDetail[] = [];
    methods?: MethodDetail[] = [];
    properties?: PropertyDetail[] = [];
    mermaidDiagram = '';
    renderedSVG: SafeHtml = ''

    constructor(
        private mermaidService: MermaidService,
        private sanitizer: DomSanitizer) { }

    ngOnInit() {
        this.updateFileDetails();
        this.renderMermaidDiagram();
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['file']) {
            this.updateFileDetails();
            this.renderMermaidDiagram();
        }
    }

    ngAfterViewInit() {
        this.renderMermaidDiagram();
    }

    private async renderMermaidDiagram() {
        this.renderedSVG = '';

        if (this.file?.details) {
            this.mermaidDiagram = this.mermaidService.generateClassDiagram(this.file.details);

            if (this.mermaidDiagram) {
                try {
                    // Generate unique ID for each render (to avoid clashes)
                    const id = 'mermaid-diagram-' + Math.floor(Math.random() * 10000);

                    // Parse & render diagram to SVG
                    const { svg } = await mermaid.render(id, this.mermaidDiagram);

                    this.renderedSVG = this.sanitizer.bypassSecurityTrustHtml(svg);

                } catch (e) {
                    console.error('Error rendering Mermaid diagram', e);
                }
            }
        }
    }

    private updateFileDetails() {
        if (this.file?.details) {
            this.classes = this.file.details[ExtractorType.Class];
            if (this.classes && this.classes.length > 0) {
                this.constructors = this.classes[0].constructor;
                this.methods = this.classes[0].methods;
                this.properties = this.classes[0].properties;
            }
            this.enums = this.file.details[ExtractorType.Enum];
            this.properties = this.properties || [];
            this.constructors = this.constructors || [];
            this.methods = this.methods || [];
        }
    }

    getFileName(): string {
        return this.file?.name || '';
    }
    showClasses(): boolean {
        return this.classes !== undefined && this.classes.length > 0;
    }
    showEnums(): boolean {
        return this.enums !== undefined && this.enums.length > 0;
    }
    showProperties(): boolean {
        return this.properties !== undefined && this.properties.length > 0;
    }
    showConstructors(): boolean {
        return this.constructors !== undefined && this.constructors.length > 0;
    }
    showMethods(): boolean {
        return this.methods !== undefined && this.methods.length > 0;
    }

    getPublicMethods(): MethodDetail[] {
        return this.methods?.filter(method => method.modifiers.includes('public')) || [];
    }

    getPrivateMethods(): MethodDetail[] {
        return this.methods?.filter(method => method.modifiers.includes('private')) || [];
    }

    getProtectedMethods(): MethodDetail[] {
        return this.methods?.filter(method => method.modifiers.includes('protected')) || [];
    }

    getMethods(): MethodDetail[] {
        return this.methods?.filter(method => !method.modifiers.some(modifier => ['public', 'private', 'protected'].includes(modifier))) || [];
    }
}