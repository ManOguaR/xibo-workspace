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

export interface ValidationIssue {
    code: string;
    message: string;
    path?: string;
}

export interface BootstrapDiscoveryResult {
    module?: XiboModule;
    templates: XiboModuleTemplate[];
    metadata: JsonObject;
    datatype?: unknown;
    issues: ValidationIssue[];
}

