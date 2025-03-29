import * as fs from 'fs';
import TreeSitter from 'tree-sitter';
import * as CSharp from 'tree-sitter-c-sharp';
import { IParser } from '../IParser';

export class CSharpParser implements IParser {
  parse(filePath: string, encoding: BufferEncoding): TreeSitter.Tree {
    const sourceCode = fs.readFileSync(filePath, encoding);

    const parser = new TreeSitter();
    parser.setLanguage(CSharp);

    const tree = parser.parse(sourceCode);

    return tree;
  }

  query(query: string): TreeSitter.Query {
    return new TreeSitter.Query(CSharp, query);
  }

}
