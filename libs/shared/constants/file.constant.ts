export const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

// export const PARSABLE_EXTENSIONS = [
//     '.ts', '.js', '.tsx', '.jsx', '.cs'
// ];

export const PARSABLE_EXTENSIONS = [
    '.cs'
];

export enum ProgrammingLanguageExtension {
    CSharp = 'cs',
    JavaScript = 'js',
    TypeScript = 'ts',
}

export enum WASMProgrammingLanguage {
    CSharp = 'c-sharp',
    JavaScript = 'javascript',
    TypeScript = 'typescript',
}

export const IGNORED_PATTERNS = [
    'node_modules', 'dist', '.git', 'coverage', 'tmp', '.angular',
    'package-lock.json', 'yarn.lock'
];