import * as TreeSitter from 'tree-sitter';

export interface IParser {
    parse(filePath: string, encoding: BufferEncoding): TreeSitter.Tree;
    query(query: string): TreeSitter.Query;
}
