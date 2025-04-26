import { ConstructorMethodDetail, MethodDetail, ParameterDetail } from "@doci/shared";

export function assignParametersToMethods(parameterDetails: ParameterDetail[], methodDetails: MethodDetail[]): MethodDetail[] {
    if (parameterDetails && methodDetails) {
        methodDetails.forEach(method => {
            if (method.parameters) {
                method.parameters = method.parameters.map(parameter => {
                    const matchingParameter = parameterDetails.find(param => param.name === parameter.name &&
                        param.startPosition.row === parameter.startPosition.row &&
                        param.startPosition.column === parameter.startPosition.column
                    );
                    return matchingParameter || parameter;
                });
            }
        });
    }
    return methodDetails;
}

export function assignParametersToConstructors(parameterDetails: ParameterDetail[], constructorDetails: ConstructorMethodDetail[]): ConstructorMethodDetail[] {
    if (parameterDetails && constructorDetails) {
        constructorDetails.forEach(constructor => {
            if (constructor.parameters) {
                constructor.parameters = constructor.parameters.map(parameter => {
                    const matchingParameter = parameterDetails.find(param => param.name === parameter.name &&
                        param.startPosition.row === parameter.startPosition.row &&
                        param.startPosition.column === parameter.startPosition.column
                    );
                    return matchingParameter || parameter;
                });
            }
        });
    }
    return constructorDetails;
}