import { JsonObject, ValidationIssue } from "../private-types";

export class MetadataValidator {
    constructor(
        private readonly metadata: JsonObject
    ) {
    }

    validate(): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        // comprueba todo lo que pueda comprobar en ESTA fase

        return issues;
    }
}

export { ValidationIssue }