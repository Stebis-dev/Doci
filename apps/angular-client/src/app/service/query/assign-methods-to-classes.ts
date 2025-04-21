import { ClassDetail } from "./extractor/class.extractor";
import { MethodDetail } from "./extractor/method.extractor";

export function assignMethodsToClasses(
    classes: ClassDetail[],
    methods: MethodDetail[]
) {
    for (const cls of classes) {
        const methodDetails: MethodDetail[] = []

        for (const methodName of cls.methods) {
            const methodDetail = methods.find(method =>
                method.name === methodName.name &&
                method.startPosition >= cls.startPosition &&
                method.endPosition <= cls.endPosition
            );

            if (methodDetail) {
                methodDetails.push(methodDetail);
            }
        }
        cls.methods = methodDetails;
    }

    return classes;
}