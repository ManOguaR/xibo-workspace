import { XiboModuleTemplate } from 'xibo-modules';
import type { JsonObject, JsonValue, ValidationIssue, BootstrapDiscoveryResult  } from "../private-types";

export class BootstrapValidator {

    validateIdentity(
        metadata: JsonObject
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        // reglas de id

        return issues;
    }

    validateModuleTemplates(
        metadata: JsonObject,
        templates: XiboModuleTemplate[]
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        // metadata requerida para ese template concreto

        return issues;
    }
}

export type { ValidationIssue };
