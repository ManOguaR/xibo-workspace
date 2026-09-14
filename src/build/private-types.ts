import { XiboModule, XiboModuleTemplate } from "xibo-modules";

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonObject
    | JsonValue[];

export interface JsonObject {
    [key: string]: JsonValue;
}

export enum ValidationSeverity {
    Info,
    Warning,
    Error,
    Critical
}

export interface ValidationIssue {
    severity: ValidationSeverity;
    code: string;
    message: string;
    path?: string;
}

export class BootstrapDiscoveryResult {
    module?: XiboModule;
    templates: XiboModuleTemplate[] = [];
    metadata: JsonObject = {};
    issues: ValidationIssue[] = [];

    hasErrors(): boolean {
        return this.issues.some(
            issue =>
                issue.severity === ValidationSeverity.Error ||
                issue.severity === ValidationSeverity.Critical
        );
    };
}

