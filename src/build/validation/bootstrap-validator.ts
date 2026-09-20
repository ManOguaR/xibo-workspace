import { XiboModuleBase, XiboModuleTemplate } from 'xibo-modules';
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
 
    validateModuleTemplates(
        metadata: JsonObject,
        templates: XiboModuleTemplate[]
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        const moduleObjectMetadata = new Set([
            "datatype",
            "group",
            "initialSize"
        ]);
        
        const definitions = Object.entries(metadata).filter(
            ([key, value]) =>
                !moduleObjectMetadata.has(key) &&
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)
        );
                
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
            if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(id)) {
                issues.push({
                    severity: ValidationSeverity.Error,
                    code: "bootstrap.template.id-invalid",
                    path: id,
                    message: `Template id '${id}' must use snake_case.`
                });
                continue;
            }
            
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

    validateMetadata(
        metadata: JsonObject
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        const version = metadata["version"];
        
        if (version !== undefined && (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version))) {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "bootstrap.metadata.version-invalid",
                path: "version",
                message: "Metadata 'version' must be a semantic version in the form x.y.z."
            });
        }
        
        const thumbnail = metadata["thumbnail"];
        
        if (thumbnail !== undefined && typeof thumbnail !== "string") {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "bootstrap.metadata.thumbnail-invalid",
                path: "thumbnail",
                message: "Metadata 'thumbnail' must be a string."
            });
        }
        
        const initialSize = metadata["initialSize"];

        if (initialSize !== undefined) {
            if (!this.isObject(initialSize)) {
                issues.push({
                    severity: ValidationSeverity.Error,
                    code: "bootstrap.metadata.initial-size-invalid",
                    path: "initialSize",
                    message: "Metadata 'initialSize' must be an object."
                });
            }
            else {
                const width = initialSize["width"];
                const height = initialSize["height"];

                if (typeof width !== "number" ||
                    !Number.isFinite(width) ||
                    width <= 0) {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "bootstrap.metadata.initial-size-width-invalid",
                        path: "initialSize.width",
                        message: "Metadata 'initialSize.width' must be a positive number."
                    });
                }
                
                if (typeof height !== "number" || !Number.isFinite(height) || height <= 0) {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "bootstrap.metadata.initial-size-height-invalid",
                        path: "initialSize.height",
                        message: "Metadata 'initialSize.height' must be a positive number."
                    });
                }
            }
        }
        
        const allowPreview = metadata["allowPreview"];
        
        if (allowPreview !== undefined && typeof allowPreview !== "boolean") {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "bootstrap.metadata.allow-preview-invalid",
                path: "allowPreview",
                message: "Metadata 'allowPreview' must be a boolean."
            });
        }
        
        const showIn = metadata["showIn"];
        
        if (showIn !== undefined && (typeof showIn !== "string" || !["none", "layout", "playlist", "both"].includes(showIn))) {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "bootstrap.metadata.show-in-invalid",
                path: "showIn",
                message: "Metadata 'showIn' must be one of: none, layout, playlist, both."
            });
        }
        
        const cacheKey = metadata["cacheKey"];
        
        if (cacheKey !== undefined && typeof cacheKey !== "string") {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "bootstrap.metadata.cache-key-invalid",
                path: "cacheKey",
                message: "Metadata 'cacheKey' must be a string."
            });
        }
        
        return issues;
    }
}

export type { ValidationIssue };
