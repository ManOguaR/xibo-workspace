import type { XiboPlayerHook } from "../resources/hooks.js";
import type { StencilSource } from "../resources/stencil.js";

export type XiboModuleTemplateType =
    | "static"
    | "element";

export abstract class XiboModuleTemplate {
    abstract readonly type: XiboModuleTemplateType;

    stencil?: StencilSource;

    onTemplateRender?: XiboPlayerHook;
    onTemplateVisible?: XiboPlayerHook;
    onElementParseData?: XiboPlayerHook;
}

export abstract class XiboStaticTemplate extends XiboModuleTemplate {
    readonly type = "static";
}

export abstract class XiboElementTemplate extends XiboModuleTemplate {
    readonly type = "element";
}