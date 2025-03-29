import * as fs from 'fs';
import * as path from 'path';
import { Parser } from './Parser/Parser';
import { Tree } from 'tree-sitter';
import { MethodExtractor } from './Query/MethodExtractor';
import { ExtractorType } from './Query/BaseQueryEngine';
import { EnumExtractor } from './Query/EnumExtractor';


export class DocumentationGenerator {
  private readonly supportedExtensions = ['.cs', '.js'];

  public generateDocumentation(projectPath: string, outputPath: string) {
    const files = this.getSourceFiles(projectPath);
    const documentation: { [key: string]: any } = {};

    files.forEach((file) => {
      // if (file == 'D:\\Doci\\tests\\external-projects\\csharp\\BattleshipModellingPractice\\BattleshipModellingPractice\\Enums.cs')
      documentation[file] = this.extractDetails(file);
    });

    fs.writeFileSync(
      outputPath,
      JSON.stringify(documentation, null, 2),
      'utf8',
    );

    console.log(`Documentation generated at ${outputPath}`);
  }

  private extractDetails(file: string) {
    const extensionName = path.extname(file);
    try {
      const parser = new Parser(extensionName);

      const abstractSyntaxTree = parser.parse(file); // returns TreeSitter.Tree 


      const extractors = [
        new MethodExtractor(parser),
        new EnumExtractor(parser),
      ];

      const doc: { filePath: string } & { [key in ExtractorType]?: any } = {
        filePath: file,
      };

      extractors.forEach(extractor => {
        doc[extractor.type] = extractor.extract(abstractSyntaxTree);
      });

      return doc;
    } catch (error) {
      console.warn(`Skipping unsupported file: ${file}`, error);
    }
  }

  private getSourceFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        results = results.concat(this.getSourceFiles(file));
      } else if (this.supportedExtensions.includes(path.extname(file))) {
        results.push(file);
      }
    });
    return results;
  }
}

const generator = new DocumentationGenerator();

generator.generateDocumentation(
  path.resolve(
    __dirname,
    '../tests/external-projects/csharp/BattleshipModellingPractice/BattleshipModellingPractice',
  ),
  path.resolve(__dirname, 'output.json'),
);
