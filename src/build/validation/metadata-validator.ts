import { ValidationSeverity, type JsonObject, type JsonValue, type ValidationIssue } from "../private-types";

export class MetadataValidator {

    validate(
        metadata: JsonObject,
        stage: MetadataValidationStage
    ): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        // Required
        this.validateId(metadata, stage, issues);
        this.validateName(metadata, stage, issues);
        this.validateType(metadata, stage, issues);
        this.validateSchemaVersion(metadata, stage, issues);
        this.validateAssignable(metadata, stage, issues);
        this.validateRegionSpecific(metadata, stage, issues);
        this.validateRenderAs(metadata, stage, issues);
        this.validateDefaultDuration(metadata, stage, issues);

        // Optional
        this.validateAuthor(metadata, stage, issues);
        this.validateDescription(metadata, stage, issues);
        this.validateIcon(metadata, stage, issues);
        this.validateClass(metadata, stage, issues);
        this.validateThumbnail(metadata, stage, issues);

        this.validateStartWidth(metadata, stage, issues);
        this.validateStartHeight(metadata, stage, issues);

        this.validateDataType(metadata, stage, issues);
        this.validateDataCacheKey(metadata, stage, issues);
        this.validateFallbackData(metadata, stage, issues);

        this.validateCompatibilityClass(metadata, stage, issues);
        this.validateShowIn(metadata, stage, issues);

        this.validateHasThumbnail(metadata, stage, issues);
        this.validateAllowPreview(metadata, stage, issues);

        // Template metadata
        this.validateTemplates(metadata, stage, issues);

        return issues;
    }

    private validateId(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery: {
                const value = metadata["id"];

                if (value === undefined) {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "metadata.id.required",
                        path: "id",
                        message: "Module id is required."
                    });

                    return;
                }

                if (typeof value !== "string") {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "metadata.id.invalid-type",
                        path: "id",
                        message: "Module id must be a string."
                    });

                    return;
                }

                if (!this.isValidIdentifier(value)) {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "metadata.id.invalid-format",
                        path: "id",
                        message: "Module id must contain only lowercase letters, numbers and hyphens."
                    });
                }

                return;
            }

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateName(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery: {
                const value = metadata["name"];

                if (value === undefined) {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "metadata.name.required",
                        path: "name",
                        message: "Module name is required."
                    });

                    return;
                }

                if (typeof value !== "string") {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "metadata.name.invalid-type",
                        path: "name",
                        message: "Module name must be a string."
                    });

                    return;
                }

                if (value.trim().length === 0) {
                    issues.push({
                        severity: ValidationSeverity.Error,
                        code: "metadata.name.invalid-value",
                        path: "name",
                        message: "Module name cannot be empty."
                    });
                }

                return;
            }

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateType(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateSchemaVersion(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateAssignable(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateRegionSpecific(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateRenderAs(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateDefaultDuration(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateAuthor(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateDescription(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateIcon(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateClass(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateThumbnail(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateStartWidth(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateStartHeight(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateDataType(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateDataCacheKey(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateFallbackData(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateCompatibilityClass(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateShowIn(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateHasThumbnail(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateAllowPreview(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                return;

            case MetadataValidationStage.Resolution:
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateTemplates(
        metadata: JsonObject,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        for (const [property, value] of Object.entries(metadata)) {
            if (MetadataValidator.ModuleMetadataProperties.has(property)) {
                continue;
            }

            this.validateTemplate(property, value, stage, issues);
        }
    }

    private validateTemplate(
        id: string,
        value: JsonValue,
        stage: MetadataValidationStage,
        issues: ValidationIssue[]
    ): void {
        switch (stage) {
            case MetadataValidationStage.Discovery:
                this.validateTemplateId(id, issues);
                this.validateTemplateMetadata(id, value, issues);
                return;

            case MetadataValidationStage.Resolution:
                // validaciones adicionales
                return;

            case MetadataValidationStage.Bootstrap:
                return;

            case MetadataValidationStage.Emission:
                return;
        }
    }

    private validateTemplateId(
        templateId: string,
        issues: ValidationIssue[]
    ): void {
        if (!this.isValidIdentifier(templateId)) {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "metadata.template.id.invalid-format",
                path: templateId,
                message: `Template id '${templateId}' must contain only lowercase letters, numbers and hyphens.`
            });
        }
    }

    private validateTemplateMetadata(
        templateId: string,
        value: JsonValue,
        issues: ValidationIssue[]
    ): void {
        if (
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
        ) {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "metadata.template.invalid-type",
                path: templateId,
                message: `Template metadata '${templateId}' must be an object.`
            });

            return;
        }

        this.validateTemplateName(templateId, value, issues);
    }

    private validateTemplateName(
        templateId: string,
        metadata: JsonObject,
        issues: ValidationIssue[]
    ): void {
        const value = metadata["name"];
        const path = `${templateId}.name`;

        if (value === undefined) {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "metadata.template.name.required",
                path,
                message: `Template '${templateId}' name is required.`
            });

            return;
        }

        if (typeof value !== "string") {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "metadata.template.name.invalid-type",
                path,
                message: `Template '${templateId}' name must be a string.`
            });

            return;
        }

        if (value.trim().length === 0) {
            issues.push({
                severity: ValidationSeverity.Error,
                code: "metadata.template.name.invalid-value",
                path,
                message: `Template '${templateId}' name cannot be empty.`
            });
        }
    }

    private isValidIdentifier(value: string): boolean {
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
    }

    private static readonly ModuleMetadataProperties = new Set<string>([
        "id",
        "name",
        "type",
        "schemaVersion",
        "assignable",
        "regionSpecific",
        "renderAs",
        "defaultDuration",
        "author",
        "description",
        "icon",
        "class",
        "thumbnail",
        "startWidth",
        "startHeight",
        "dataType",
        "dataCacheKey",
        "fallbackData",
        "compatibilityClass",
        "showIn",
        "hasThumbnail",
        "allowPreview"
    ]);
}

export type { ValidationIssue };

export enum MetadataValidationStage {
    Discovery,
    Resolution,
    Bootstrap,
    Emission
}