import { Parser, Tree } from "web-tree-sitter";
import { assignMethodsToClasses } from "./assign-methods-to-classes";
import { ExtractorType } from "./extractor/base-query.engine";
import { ClassExtractor, ClassDetail } from "./extractor/class.extractor";
import { MethodExtractor, MethodDetail } from "./extractor/method.extractor";
import { EnumExtractor } from "./extractor/enum.extractor";
import { ProjectFile } from "@doci/shared";

export interface ExtractedDetails {
    filePath: string;
    [ExtractorType.Class]?: ClassDetail[];
    [ExtractorType.Method]?: MethodDetail[];
    [ExtractorType.Enum]?: EnumExtractor[];
}

export function extractDetails(file: ProjectFile, AST: Tree, parser: Parser): ExtractedDetails | null {
    try {
        const extractors = [
            new ClassExtractor(parser),
            new MethodExtractor(parser),
            new EnumExtractor(parser),
        ];

        const doc: ExtractedDetails = {
            filePath: file.name,
        };

        const extractedData: { [key in ExtractorType]?: any } = {};
        extractors.forEach(extractor => {
            try {
                extractedData[extractor.type] = extractor.extract(AST);
            } catch (error) {
                console.warn(`Error extracting ${extractor.type} from ${file.name}:`, error);
            }
        });

        // Assign methods to their respective classes
        if (extractedData[ExtractorType.Class] && extractedData[ExtractorType.Method]) {
            const classes = extractedData[ExtractorType.Class] as ClassDetail[];
            const methods = extractedData[ExtractorType.Method] as MethodDetail[];
            doc[ExtractorType.Class] = assignMethodsToClasses(classes, methods);
        } else {
            // If we have classes or methods but not both, still include them in the result
            if (extractedData[ExtractorType.Class]) {
                doc[ExtractorType.Class] = extractedData[ExtractorType.Class];
            }
            if (extractedData[ExtractorType.Method]) {
                doc[ExtractorType.Method] = extractedData[ExtractorType.Method];
            }
        }

        if (extractedData[ExtractorType.Enum]) {
            doc[ExtractorType.Enum] = extractedData[ExtractorType.Enum];
        }

        return doc;
    } catch (error) {
        console.warn(`Skipping unsupported file: ${file.name}`, error);
    }
    return null;
}