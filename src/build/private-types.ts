import { StencilOptions, XiboModule, XiboModuleTemplate } from "xibo-modules";

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

    log() {
        if (this.issues.length > 0) {
            for (const issue of this.issues) {
                console.log(
                    `[${ValidationSeverity[issue.severity]}] ` +
                    `${issue.code}` +
                    `${issue.path ? ` (${issue.path})` : ""}: ` +
                    issue.message
                );
            }
        }
        else {
            console.log("Bootstrap validation successful.");
        }
    }
}

export interface StencilResult extends StencilOptions {
    kind: "twig" | "hbs";
    content: string;
    id?: string;
}
