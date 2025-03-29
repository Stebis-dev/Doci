import * as fs from 'fs';
import TreeSitter from 'tree-sitter';
import * as JavaScript from 'tree-sitter-javascript';
import { IParser } from '../IParser';


// TODO fix this implementation as in CSharpParser
export class JavaScriptParser implements IParser {
    parse(filePath: string, encoding: BufferEncoding): any {
        const sourceCode = fs.readFileSync(filePath, encoding);
        const parser = new TreeSitter();
        parser.setLanguage(JavaScript);
        const tree = parser.parse(sourceCode);
        return tree.rootNode.toString();
    }

    query(query: string): TreeSitter.Query {
        return new TreeSitter.Query(JavaScript, query);
    }
}
