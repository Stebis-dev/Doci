import { ExtractorType } from "controllers/extract.types";
// import { ClassExtractor } from "controllers/extractor/class.extractor";
// TODO put into the rest extractor's into index file
// import { CommentsExtractor } from "controllers/extractor/comment.extractor";
// import { ConstructorExtractor } from "controllers/extractor/constructor.extractor";
// import { EnumExtractor } from "controllers/extractor/enum.extractor";
// import { MethodUsageExtractor } from "controllers/extractor/method-usage.extractor";
// import { MethodExtractor } from "controllers/extractor/method.extractor";
// import { ParameterExtractor } from "controllers/extractor/parameter.extractor";
// import { PropertyExtractor } from "controllers/extractor/property.extractor";
import { Parser, Tree } from "web-tree-sitter";

export function extractDetails(AST: Tree, parser: Parser): void {
    const extractors = [
        // new ClassExtractor(parser, ExtractorType.Class),
        // new PropertyExtractor(parser, ExtractorType.Property),
        // new MethodExtractor(parser, ExtractorType.Method),
        // new ParameterExtractor(parser, ExtractorType.Parameter),
        // // new MethodUsageExtractor(parser, ExtractorType.MethodUsage),
        // new ConstructorExtractor(parser, ExtractorType.Constructor),
        // new EnumExtractor(parser, ExtractorType.Enum),
        // new CommentsExtractor(parser, ExtractorType.Comments),
    ];

    const extractedData: { [key in ExtractorType]?: any } = {};
    // extractors.forEach(extractor => {
    //     try {
    //         // extractedData[extractor.type] = extractor.extract(AST);
    //     } catch (error) {
    //         // console.warn(`Error extracting ${extractor.type} from ${file.name}:`, error);
    //     }
    // });
}
