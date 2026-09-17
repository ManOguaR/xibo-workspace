import type { StencilSource } from "../resources/stencil.js";
import type { XiboPropertyGroups } from "../resources/properties.js";

export type XiboModuleTemplateType =
    | "static"
    | "element";

export abstract class XiboModuleTemplate {
    abstract readonly type: XiboModuleTemplateType;
    propertyGroups?: XiboPropertyGroups;
    stencil?: StencilSource;
}

export interface XiboModuleTemplate {
    onTemplateRender?(id: string, target: { 0: HTMLElement }, items: any, properties: any, meta: any): void;
    onTemplateVisible?(id: string, target: { 0: HTMLElement }, items: any, properties: any, meta: any): void;
    onElementParseData?(value: any, properties: any): void;
}

export abstract class XiboStaticTemplate extends XiboModuleTemplate {
    readonly type = "static";
}

export abstract class XiboElementTemplate extends XiboModuleTemplate {
    readonly type = "element";
}