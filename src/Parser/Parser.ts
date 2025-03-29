import { IParser } from './IParser';
import { CSharpParser } from './ParserImplementations/CSharpParser';
import { JavaScriptParser } from './ParserImplementations/JavaScriptParser';
import * as TreeSitter from 'tree-sitter';

enum ProgrammingLanguage {
  CSharp = '.cs',
  Java = '.java',
  Python = '.py',
  JavaScript = '.js',
}

const programmingLanguage2StrategyMap = new Map<ProgrammingLanguage, new () => IParser>([
  [ProgrammingLanguage.CSharp, CSharpParser],
  [ProgrammingLanguage.JavaScript, JavaScriptParser],
]);

export class Parser {
  private readonly parser: IParser;

  constructor(fileExtension: string) {
    this.parser = this.getStrategy(fileExtension);
  }

  private getStrategy(fileExtension: string): IParser {
    const strategyClass = programmingLanguage2StrategyMap.get(fileExtension as ProgrammingLanguage);
    if (!strategyClass) {
      throw new Error(`No parser available for extension: ${fileExtension}`);
    }

    return new strategyClass();
  }

  public parse(filePath: string): TreeSitter.Tree {
    return this.parser.parse(filePath, 'utf8');
  }

  public query(query: string): TreeSitter.Query {
    return this.parser.query(query);
  }
}
