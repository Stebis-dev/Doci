import { Component, OnInit } from '@angular/core';
import { TreeSitterService } from '../../service/tree-sitter/tree-sitter.service';

@Component({
    selector: 'app-code-parser',
    template: '<div>{{ parsedCode }}</div>'
})
export class CodeParserComponent implements OnInit {
    parsedCode: string | null = null;

    constructor(private treeSitterService: TreeSitterService) { }

    async ngOnInit() {
        const code = `
            function example() {
                return "Hello, World!";
            }
        `;

        try {
            await this.treeSitterService.initialize(); // Initialize the parser
            await this.treeSitterService.setLanguage('js'); // Set the parser for JavaScript
            const tree = await this.treeSitterService.parse(code);
            this.parsedCode = tree?.rootNode.toString() ?? 'No parsed code available';
        } catch (error) {
            console.error('Error parsing code:', error);
        }
    }

}