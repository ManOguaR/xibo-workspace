import type { XiboPlayerHook } from "../resources/hooks.js";
import type { StencilSource } from "../resources/stencil.js";

export abstract class XiboModule {
    stencil?: StencilSource;

    preview?: StencilSource;
    
    onInitialize?: XiboPlayerHook;
    onDataLoad?: XiboPlayerHook;
    onParseData?: XiboPlayerHook;
    onRender?: XiboPlayerHook;
    onVisible?: XiboPlayerHook;

}