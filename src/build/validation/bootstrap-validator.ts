import { XiboModule, XiboModuleTemplate } from 'xibo-modules';
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
        metadata: JsonObject,
        module: XiboModule
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        const id = metadata["id"];

        if (typeof id === "string") {
            const expectedName = id
                .split(/[^a-zA-Z0-9]+/)
                .filter(Boolean)
                .map(part =>
                    part.charAt(0).toUpperCase() +
                    part.slice(1)
                )
                .join("");

            if (module.constructor.name !== expectedName) {
                issues.push({
                    severity: ValidationSeverity.Warning,
                    code: "bootstrap.module.name-mismatch",
                    path: "id",
                    message:
                        `Module '${id}' expects class '${expectedName}', ` +
                        `but '${module.constructor.name}' was discovered.`
                });
            }
        }

        return issues;
    }
    
    validateModuleTemplates(
        metadata: JsonObject,
        templates: XiboModuleTemplate[]
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        const definitions = Object.entries(metadata).filter(([key, value]) =>
                key !== "datatype" &&
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value));
                
        if (definitions.length !== templates.length) {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "bootstrap.templates.count-mismatch",
                message:
                    `Discovered ${templates.length} template(s), ` +
                    `but metadata defines ${definitions.length}.`
            });
        }
        
        for (const [id] of definitions) {
            const expectedName = id.split(/[^a-zA-Z0-9]+/)
                .filter(Boolean)
                .map(part =>
                    part.charAt(0).toUpperCase() +
                    part.slice(1)
                )
                .join("");

            const template = templates.find(
                candidate =>
                    candidate.constructor.name === expectedName
            );

            if (template === undefined) {
                issues.push({
                    severity: ValidationSeverity.Warning,
                    code: "bootstrap.template.name-mismatch",
                    path: id,
                    message:
                        `Template '${id}' expects class '${expectedName}', ` +
                        "but no matching template class was discovered."
                });
            }
        }

        return issues;
    }
}

export type { ValidationIssue };
