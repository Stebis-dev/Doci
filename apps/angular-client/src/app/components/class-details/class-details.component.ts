import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassDetail, ConstructorMethodDetail, EnumDetail, EnumMember, ExtractorType, MethodDetail, ProjectFile, PropertyDetail } from '@doci/shared';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import mermaid from 'mermaid';
import { MermaidService } from '../../service/mermaid/mermaid.service';
import { MethodListComponent } from '../method-list/method-list.component';
import { PropertyListComponent } from '../property-list/property-list.component';
import { ConstructorListComponent } from '../constructor-list/constructor-list.component';
import { EnumMemberListComponent } from '../enum-member-list/enum-member-list.component';
import { FileTreeSelection } from '../file-tree/file-tree.types';
import { DescriptionComponent } from '../description/description.component';
import { ProjectService } from '../../service/project.service';
import { ThemeService } from '../../service/theme.service';

@Component({
    selector: 'app-class-details',
    standalone: true,
    imports: [
        CommonModule,
        MethodListComponent,
        PropertyListComponent,
        ConstructorListComponent,
        EnumMemberListComponent,
        DescriptionComponent
    ],
    templateUrl: './class-details.component.html',
})
export class ClassDetailsComponent implements OnInit, OnChanges, AfterViewInit {

    @Input() file: ProjectFile | null = null;
    @Input() selectedNode: FileTreeSelection | null = null;

    classObj: ClassDetail | null = null;
    enumObj: EnumDetail | null = null;
    constructors?: ConstructorMethodDetail[] = [];
    methods?: MethodDetail[] = [];
    properties?: PropertyDetail[] = [];

    generatedDescription: string | null = null;
    isEditingDescription = false;

    mermaidDiagram = '';
    renderedSVG: SafeHtml = ''

    zoomLevel = 1;
    minZoom = 0.5;
    maxZoom = 2;
    zoomStep = 0.1;

    isDragging = false;
    startX = 0;
    startY = 0;
    translateX = 0;
    translateY = 0;

    constructor(
        private readonly mermaidService: MermaidService,
        private readonly sanitizer: DomSanitizer,
        private readonly projectService: ProjectService,
        private readonly themeService: ThemeService
    ) { }

    ngOnInit() {
        this.updateFileDetails();
        this.renderMermaidDiagram();
        mermaid.initialize({
            startOnLoad: true,
            theme: this.themeService.getMermaidTheme(),
            securityLevel: 'loose',
        });

        // Subscribe to theme changes
        this.themeService.currentTheme$.subscribe(() => {
            mermaid.initialize({
                startOnLoad: true,
                theme: this.themeService.getMermaidTheme(),
                securityLevel: 'loose',
            });
            this.renderMermaidDiagram();
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['file'] || changes['selectedNode']) {
            this.updateFileDetails();
            this.renderMermaidDiagram();
        }
    }

    ngAfterViewInit() {
        this.renderMermaidDiagram();
        this.updateZoom();
    }

    private async renderMermaidDiagram() {
        this.renderedSVG = '';

        if (this.file?.details) {
            if (this.selectedNode?.selectedType === 'class' && this.classObj) {
                this.mermaidDiagram = this.mermaidService.generateClassDiagramFromClass(this.classObj)
            }
            else if (this.selectedNode?.selectedType === 'enum' && this.enumObj) {
                this.mermaidDiagram = this.mermaidService.generateClassDiagramFromEnum(this.enumObj)
            }


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
            const classes = this.file.details[ExtractorType.Class];
            if (this.selectedNode && this.selectedNode.className) {
                this.classObj = classes?.filter(c => c.name === this.selectedNode?.className)[0] || null;
                this.methods = this.classObj?.methods || [];
                this.properties = this.classObj?.properties || [];
                this.constructors = this.classObj?.constructors || [];
            }

            const enums = this.file.details[ExtractorType.Enum];
            if (this.selectedNode && this.selectedNode.enumName) {
                this.enumObj = enums?.filter(c => c.name === this.selectedNode?.enumName)[0] || null;
            }

            this.properties = this.properties || [];
            this.constructors = this.constructors || [];
            this.methods = this.methods || [];
        }
    }

    getFileName(): string {
        return this.file?.name || '';
    }
    showClass(): boolean {
        return this.classObj !== undefined && this.selectedNode?.className !== undefined;
    }
    showEnum(): boolean {
        return this.enumObj !== undefined && this.selectedNode?.enumName !== undefined;
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
    getClassName(): string {
        return this.classObj?.name || '';
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

    getEnumName(): string {
        return this.enumObj?.name || '';
    }

    getEnumMembers(): EnumMember[] {
        return this.enumObj?.members || [];
    }

    getDescription(): string {
        return this.classObj?.comment || '';
    }

    getClassUuid(): string {
        return this.classObj?.uuid || '';
    }

    onDescriptionGenerated(description: string): void {
        this.generatedDescription = description;
        console.log('Description generated:', description);
    }

    onSaveDescription(description?: string): void {
        this.isEditingDescription = false;
        console.log('Saving description:', description);

        if (description && this.classObj) {
            // Update the class object's comment
            this.classObj.comment = description;
            this.generatedDescription = description;

            // Update the class in the current project
            this.updateClassInProject();
        }
    }

    private updateClassInProject(): void {
        if (!this.classObj || !this.file) return;

        const currentProject = this.projectService.getCurrentProject();
        if (!currentProject) return;

        // Find the file in the current project
        const fileIndex = currentProject.files.findIndex(f => f.uuid === this.file?.uuid);
        if (fileIndex === -1) return;

        // Find the class in the file
        const classIndex = currentProject.files[fileIndex].details?.[ExtractorType.Class]?.findIndex(
            c => c.uuid === this.classObj?.uuid
        );

        if (classIndex !== undefined && classIndex !== -1) {
            // Update the class comment
            currentProject.files[fileIndex].details![ExtractorType.Class]![classIndex].comment = this.classObj!.comment;

            // Update the project in the service
            this.projectService.updateCurrentProject(currentProject);
        }
    }

    onCancelDescriptionEdit(): void {
        this.isEditingDescription = false;
    }

    onMouseWheel(event: WheelEvent) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));

        if (newZoom !== this.zoomLevel) {
            this.zoomLevel = newZoom;
            this.updateZoom();
        }
    }

    onMouseDown(event: MouseEvent) {
        if (event.button === 2) { // Right click
            event.preventDefault(); // Prevent context menu
            this.isDragging = true;
            this.startX = event.clientX - this.translateX;
            this.startY = event.clientY - this.translateY;
            const diagramContainer = document.querySelector('.mermaid-diagram-container');
            if (diagramContainer) {
                (diagramContainer as HTMLElement).style.cursor = 'grab';
                (diagramContainer as HTMLElement).classList.remove('transition-transform');
            }
        } else if (event.button === 0) { // Left click
            event.preventDefault(); // Prevent context menu
            const diagramContainer = document.querySelector('.mermaid-diagram-container');
            if (diagramContainer) {
                (diagramContainer as HTMLElement).style.cursor = 'context-menu';
            }
        }
    }

    onMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            event.preventDefault(); // Prevent context menu during drag
            requestAnimationFrame(() => {
                this.translateX = event.clientX - this.startX;
                this.translateY = event.clientY - this.startY;
                this.updatePan();
            });
        }
    }

    onMouseUp(event: MouseEvent) {
        event.preventDefault(); // Prevent context menu
        if (event.button === 2) { // Right click
            this.isDragging = false;
            const diagramContainer = document.querySelector('.mermaid-diagram-container');
            if (diagramContainer) {
                (diagramContainer as HTMLElement).classList.add('transition-transform');
            }
        }
        const diagramContainer = document.querySelector('.mermaid-diagram-container');
        if (diagramContainer) {
            (diagramContainer as HTMLElement).style.cursor = 'default';
        }
    }

    onMouseLeave(event: MouseEvent) {
        event.preventDefault(); // Prevent context menu
        this.isDragging = false;
        const diagramContainer = document.querySelector('.mermaid-diagram-container');
        if (diagramContainer) {
            (diagramContainer as HTMLElement).style.cursor = 'default';
            (diagramContainer as HTMLElement).classList.add('transition-transform');
        }
    }

    onContextMenu(event: MouseEvent) {
        event.preventDefault(); // Always prevent context menu in the diagram area
    }

    private updatePan() {
        const diagramContainer = document.querySelector('.mermaid-diagram-container');
        if (diagramContainer) {
            (diagramContainer as HTMLElement).style.transform =
                `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.zoomLevel})`;
        }
    }

    private updateZoom() {
        const diagramContainer = document.querySelector('.mermaid-diagram-container');
        if (diagramContainer) {
            (diagramContainer as HTMLElement).style.transform =
                `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.zoomLevel})`;
        }
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateZoom();
    }
}