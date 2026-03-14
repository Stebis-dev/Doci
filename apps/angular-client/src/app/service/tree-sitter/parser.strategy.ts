import { ProgrammingLanguageExtension, WASMProgrammingLanguage } from '@doci/types';

export const extensionToLanguage = new Map<ProgrammingLanguageExtension, string>([
    [ProgrammingLanguageExtension.CSharp, WASMProgrammingLanguage.CSharp],
    [ProgrammingLanguageExtension.JavaScript, WASMProgrammingLanguage.JavaScript],
    [ProgrammingLanguageExtension.TypeScript, WASMProgrammingLanguage.TypeScript],
]);