import { StencilOptions, XiboModuleBase, XiboModuleTemplate } from "xibo-modules";

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
    module?: XiboModuleBase;
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
    head?: string;
    style?: string;
    content: string;
    id?: string;
}

export class XiboPlayerHook {
    public readonly content: string;

    public constructor(method: (...args: any[]) => unknown) {
        const source = Function.prototype.toString.call(method).trim();
        
        if (/^async\b/.test(source)) {
            throw new Error("Xibo hooks cannot be async.");
        }

        const match = /^(?:function\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/.exec(source);

        if (!match) {
            throw new Error("Unsupported Xibo hook method format.");
        }

        this.content = match[1].trim();
    }
}