import { XiboModuleTemplate } from 'xibo-modules';
import { JsonObject, JsonValue, ValidationIssue, ValidationSeverity } from "../private-types.js";

export class BootstrapValidator {

    validateMetadataOverride(
        current: JsonObject,
        incoming: JsonObject,
        source: string
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        this.findMetadataOverrides(
            current,
            incoming,
            source,
            "",
            issues
        );

        return issues;
    }

    private findMetadataOverrides(
        current: JsonObject,
        incoming: JsonObject,
        source: string,
        parent: string,
        issues: ValidationIssue[]
    ): void {
        for (const [key, value] of Object.entries(incoming)) {
            const path = parent
                ? `${parent}.${key}`
                : key;

            const existing = current[key];

            if (
                this.isObject(existing) &&
                this.isObject(value)
            ) {
                this.findMetadataOverrides(
                    existing,
                    value,
                    source,
                    path,
                    issues
                );

                continue;
            }

            if (existing !== undefined) {
                issues.push({
                    severity: ValidationSeverity.Warning,
                    code: "bootstrap.metadata.override",
                    path,
                    message:
                        `Metadata '${path}' from '${source}' ` +
                        "overrides an existing value."
                });
            }
        }
    }

    private isObject(
        value: JsonValue | undefined
    ): value is JsonObject {
        return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        );
    }

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
