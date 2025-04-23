import { Parser, Tree } from "web-tree-sitter";
import { buildClassDetails } from "./assign-methods-to-classes";
import { ClassExtractor } from "./extractor/class.extractor";
import { MethodExtractor } from "./extractor/method.extractor";
import { EnumExtractor } from "./extractor/enum.extractor";
import { ExtractedDetails, ExtractorType, MethodDetail, ProjectFile, ClassTemporaryDetail, ConstructorMethodDetail, PropertyDetail } from "@doci/shared";
import { ConstructorExtractor } from "./extractor/constructor.extractor";
import { PropertyExtractor } from "./extractor/property.extractor";
import { MethodUsageExtractor } from "./extractor/method-usage.extractor";

export function extractDetails(file: ProjectFile, AST: Tree, parser: Parser): ExtractedDetails | null {
    try {
        const extractors = [
            new ClassExtractor(parser),
            new PropertyExtractor(parser),
            new MethodExtractor(parser),
            new MethodUsageExtractor(parser),
            new ConstructorExtractor(parser),
            new EnumExtractor(parser),
        ];

        const extractedData: { [key in ExtractorType]?: any } = {};
        extractors.forEach(extractor => {
            try {
                extractedData[extractor.type] = extractor.extract(AST);
            } catch (error) {
                console.warn(`Error extracting ${extractor.type} from ${file.name}:`, error);
            }
        });

        const doc: ExtractedDetails = {
            filePath: file.name,
        };

        const classTempDetails = extractedData[ExtractorType.Class] as ClassTemporaryDetail[];
        const propertyDetails = extractedData[ExtractorType.Property] as PropertyDetail[];
        const methodDetails = extractedData[ExtractorType.Method] as MethodDetail[];
        const constructorDetails = extractedData[ExtractorType.Constructor] as ConstructorMethodDetail[];

        // Assign methods to their respective classes
        if (classTempDetails && methodDetails) {
            const classesWithMethods = buildClassDetails(classTempDetails, propertyDetails, methodDetails, constructorDetails);
            doc[ExtractorType.Class] = classesWithMethods;
        } else if (classTempDetails) {
            doc[ExtractorType.Class] = classTempDetails.map(cls => ({
                name: cls.name,
                modifiers: cls.modifiers,
                inheritance: cls.inheritance,
                properties: [],
                constructor: [],
                methods: [],
                startPosition: cls.startPosition,
                endPosition: cls.endPosition
            }));
        }

        if (extractedData[ExtractorType.Method]) {
            doc[ExtractorType.Method] = extractedData[ExtractorType.Method];
        }

        if (extractedData[ExtractorType.MethodsUsed]) {
            doc[ExtractorType.MethodsUsed] = extractedData[ExtractorType.MethodsUsed];
        }

        if (extractedData[ExtractorType.Constructor]) {
            doc[ExtractorType.Constructor] = extractedData[ExtractorType.Constructor];
        }

        if (extractedData[ExtractorType.Property]) {
            doc[ExtractorType.Property] = extractedData[ExtractorType.Property];
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