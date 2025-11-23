import { Command } from './ICommand';
import * as path from 'path';
import * as fs from 'fs';

export class ExportCommand implements Command {
    constructor(private dir: string, private format = 'json', private out?: string) { }

    execute(): void {
        const dirPath = this.dir || process.cwd();
        const filename = this.out || null;

        // Placeholder export: produce a minimal metadata object
        const data = {
            projectPath: dirPath,
            exportedAt: new Date().toISOString(),
            format: this.format,
            note: 'Implement real exporter that converts parsed AST to chosen format'
        };

        if (filename) {
            fs.writeFileSync(filename, this.format === 'json' ? JSON.stringify(data, null, 2) : String(data));
            console.log(`Exported to ${filename}`);
        } else {
            if (this.format === 'json') console.log(JSON.stringify(data, null, 2));
            else console.log(String(data));
        }
    }
}
