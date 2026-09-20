import { StencilSource, twig } from "../resources/stencil.js";
import type { XiboPropertyGroups } from "../resources/properties.js";
import { bootstrApp } from "./bootstrApp.js";

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

export abstract class XiboStaticAppTemplate extends XiboStaticTemplate {

    stencil = twig`<div data-template-view></div>`;

    onTemplateRender(
        id: string,
        target: { 0: HTMLElement },
        items: any,
        properties: any,
        meta: any
    ) {
        const app = window.xiboModules.instances.get(id);
        
        if (!app) {
            throw new Error(`Application instance not found: ${id}`);
        }
        
        const view = target[0]
            .querySelector<HTMLElement>("[data-template-view]");

        if (!view) {
            app.rendered = false
            return;
        }

        app.render(view, items, properties, meta);
    }
}
