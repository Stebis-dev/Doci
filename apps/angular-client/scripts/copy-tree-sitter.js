const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../../node_modules/');
const targetDir = path.join(__dirname, '../src/assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Map of grammar names to their folder and file names
const grammarMap = {
    'typescript': {
        folder: 'tree-sitter-typescript',
        file: 'tree-sitter-typescript'
    },
    'javascript': {
        folder: 'tree-sitter-javascript',
        file: 'tree-sitter-javascript'
    },
    'c-sharp': {
        folder: 'tree-sitter-c-sharp',
        file: 'tree-sitter-c_sharp'
    }
};

// Copy tree-sitter.wasm
fs.copyFileSync(
    path.join(sourceDir, 'web-tree-sitter/tree-sitter.wasm'),
    path.join(targetDir, 'tree-sitter/tree-sitter.wasm')
);

// Copy language grammars
Object.entries(grammarMap).forEach(([grammar, names]) => {
    fs.copyFileSync(
        path.join(sourceDir, `${names.folder}/${names.file}.wasm`),
        path.join(targetDir, `tree-sitter-${grammar}.wasm`)
    );
}); 