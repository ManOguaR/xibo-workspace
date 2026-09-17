import type { XiboPlayerHook } from "../resources/hooks.js";
import type { StencilSource } from "../resources/stencil.js";

export type XiboModuleTemplateType =
    | "static"
    | "element";

export abstract class XiboModuleTemplate {
    abstract readonly type: XiboModuleTemplateType;

    stencil?: StencilSource;
}

export interface XiboModuleTemplate {

    onTemplateRender?(id: string, target: HTMLElement, items: any, properties: any, meta: any): void;
    onTemplateVisible?(id: string, target: HTMLElement, items: any, properties: any, meta: any): void;
    onElementParseData?(value: any, properties: any): void;

    // onTemplateRender?: XiboPlayerHook;
    // onTemplateVisible?: XiboPlayerHook;
    // onElementParseData?: XiboPlayerHook;

    // onTemplateRender(id, target, items, properties, meta)
    // onTemplateVisible(id, target, items, properties, meta)
    // onElementParseData(value, properties)
}

export abstract class XiboStaticTemplate extends XiboModuleTemplate {
    readonly type = "static";
}

export abstract class XiboElementTemplate extends XiboModuleTemplate {
    readonly type = "element";
}