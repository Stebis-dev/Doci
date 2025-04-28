import { ExtractedDetails, ExtractorType, MethodDetail, ProjectFile, ClassTemporaryDetail, ConstructorMethodDetail, PropertyDetail, MethodsUsedDetail, ParameterDetail, Details } from "@doci/shared";
import { assignParametersToConstructors, assignParametersToMethods, assignCommentsToMethods } from "./build-method-details";
import { assignCommentsToClasses, buildClassDetails } from "./build-class-details";
import { Parser, Tree } from "web-tree-sitter";
import { ClassExtractor } from "./extractor/class.extractor";
import { MethodExtractor } from "./extractor/method.extractor";
import { EnumExtractor } from "./extractor/enum.extractor";
import { ConstructorExtractor } from "./extractor/constructor.extractor";
import { PropertyExtractor } from "./extractor/property.extractor";
import { MethodUsageExtractor } from "./extractor/method-usage.extractor";
import { ParameterExtractor } from "./extractor/parameter.extractor";
import { CommentsExtractor } from "./extractor/comment.extractor";
import { generateUUID } from "../../utils/utils";

export function extractDetails(file: ProjectFile, AST: Tree, parser: Parser): ExtractedDetails | null {
    try {
        const extractors = [
            new ClassExtractor(parser),
            new PropertyExtractor(parser),
            new MethodExtractor(parser),
            new ParameterExtractor(parser),
            new MethodUsageExtractor(parser),
            new ConstructorExtractor(parser),
            new EnumExtractor(parser),
            new CommentsExtractor(parser),
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

        let classTempDetails = extractedData[ExtractorType.Class] as ClassTemporaryDetail[];
        const propertyDetails = extractedData[ExtractorType.Property] as PropertyDetail[];
        let methodDetails = extractedData[ExtractorType.Method] as MethodDetail[];
        const parameterDetails = extractedData[ExtractorType.Parameter] as ParameterDetail[];
        let constructorDetails = extractedData[ExtractorType.Constructor] as ConstructorMethodDetail[];
        const methodsUsedDetails = extractedData[ExtractorType.MethodsUsed] as MethodsUsedDetail[];
        const comments = extractedData[ExtractorType.Comments] as Details[];

        classTempDetails.map(cls => cls.uuid = generateUUID(file.uuid as string, cls.uuid));

        // Assign parameters to their respective methods
        methodDetails = assignParametersToMethods(parameterDetails, methodDetails);

        // Assign parameters to their respective constructors
        constructorDetails = assignParametersToConstructors(parameterDetails, constructorDetails);

        // First assign comments to methods
        const { updatedMethods } = assignCommentsToMethods(comments, methodDetails, classTempDetails);
        methodDetails = [...updatedMethods];

        const { updatedClasses, leftComments } = assignCommentsToClasses(comments, classTempDetails);
        classTempDetails = [...updatedClasses];


        doc.comment = leftComments.length > 0 ? leftComments.map(comment => comment.name).join('\n') : undefined;

        // Assign methods to their respective classes, passing unused comments for class-level assignment
        if (classTempDetails && methodDetails) {
            const classesWithMethods = buildClassDetails(
                classTempDetails,
                propertyDetails,
                methodDetails,
                constructorDetails,
                methodsUsedDetails
            );
            doc[ExtractorType.Class] = classesWithMethods;
        } else if (classTempDetails) {
            doc[ExtractorType.Class] = classTempDetails.map(cls => ({
                uuid: cls.uuid,
                name: cls.name,
                modifiers: cls.modifiers,
                inheritance: cls.inheritance,
                properties: [],
                constructors: [],
                methods: [],
                methodsUsed: [],
                objectsUsed: [],
                body: cls.body,
                comment: cls.comment,
                startPosition: cls.startPosition,
                endPosition: cls.endPosition
            }));
        }

        if (extractedData[ExtractorType.MethodsUsed]) {
            doc[ExtractorType.MethodsUsed] = extractedData[ExtractorType.MethodsUsed];
        }

        if (extractedData[ExtractorType.Comments]) {
            doc[ExtractorType.Comments] = extractedData[ExtractorType.Comments];
        }

        // TODO add comments to enums
        if (extractedData[ExtractorType.Enum]) {
            doc[ExtractorType.Enum] = extractedData[ExtractorType.Enum];
        }

        return doc;
    } catch (error) {
        console.warn(`Skipping unsupported file: ${file.name}`, error);
    }
    return null;
}