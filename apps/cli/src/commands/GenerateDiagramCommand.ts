import { Command } from './ICommand';
import * as path from 'path';

export class GenerateDiagramCommand implements Command {
    constructor(private dir: string, private out?: string) { }

    execute(): void {
        const dirPath = this.dir || process.cwd();
        // Placeholder: wire in tree-sitter / graph generation here.
        const filename = this.out || path.join(process.cwd(), 'diagram.svg');
        console.log(`(stub) generate diagram for ${dirPath} -> ${filename}`);
        // In future: parse files, create graph, write SVG/PNG to filename.
    }
}
