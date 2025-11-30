import { ExtractedDetails, ExtractorType, MethodDetail, ProjectFile, ClassTemporaryDetail, ConstructorMethodDetail, PropertyDetail, MethodsUsedDetail, ParameterDetail, Details } from "@doci/shared";
import { ClassExtractor } from "apps/cli/src/controllers/extractor/class.extractor";
import { CommentsExtractor } from "apps/cli/src/controllers/extractor/comment.extractor";
import { ConstructorExtractor } from "apps/cli/src/controllers/extractor/constructor.extractor";
import { EnumExtractor } from "apps/cli/src/controllers/extractor/enum.extractor";
import { MethodUsageExtractor } from "apps/cli/src/controllers/extractor/method-usage.extractor";
import { MethodExtractor } from "apps/cli/src/controllers/extractor/method.extractor";
import { ParameterExtractor } from "apps/cli/src/controllers/extractor/parameter.extractor";
import { PropertyExtractor } from "apps/cli/src/controllers/extractor/property.extractor";
import { Parser, Tree } from "web-tree-sitter";

export function extractDetails(file: ProjectFile, AST: Tree, parser: Parser): void {
    const extractors = [
        new ClassExtractor(parser, ExtractorType.Class),
        // new PropertyExtractor(parser, ExtractorType.Property),
        // new MethodExtractor(parser, ExtractorType.Method),
        // new ParameterExtractor(parser, ExtractorType.Parameter),
        // // new MethodUsageExtractor(parser, ExtractorType.MethodUsage),
        // new ConstructorExtractor(parser, ExtractorType.Constructor),
        // new EnumExtractor(parser, ExtractorType.Enum),
        // new CommentsExtractor(parser, ExtractorType.Comments),
    ];

    const extractedData: { [key in ExtractorType]?: any } = {};
    extractors.forEach(extractor => {
        try {
            extractedData[extractor.type] = extractor.extract(AST);
        } catch (error) {
            console.warn(`Error extracting ${extractor.type} from ${file.name}:`, error);
        }
    });
}
