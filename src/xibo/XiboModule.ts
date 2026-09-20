import { StencilSource, twig } from "../resources/stencil.js";
import type { XiboPropertyGroups } from "../resources/properties.js";
import { bootstrApp } from "./bootstrApp.js";
import { XiboModuleApplication } from "./XiboModuleApplication.js";

export abstract class XiboModuleBase {
    propertyGroups?: XiboPropertyGroups;
    preview?: StencilSource;
    stencil?: StencilSource;
}    

export interface XiboModuleBase {
    onInitialize?(id: string, target: { 0: HTMLElement }, properties: any, meta: any): void;
    onParseData?(item: any, properties: any, meta: any): void;
    onDataLoad?(item: any, meta: any, properties: any, isDataReady: boolean): void;
    onRender?(id: string, target: { 0: HTMLElement }, items: any, properties: any, meta: any): void;
    onVisible?(id: string, target: { 0: HTMLElement }, items: any, properties: any, meta: any): void;
}

export abstract class XiboModule extends XiboModuleBase {
    private currentApp?: XiboModuleApplication;

    protected get application(): XiboModuleApplication | undefined {
        return this.currentApp;
    }
    
    //TODO: Print data-appname-config
    //TODO: Iterate @Settings data-setting-name= {{setting}}
    //TODO: We can render a data-module-view to optionally render in module
    stencil = twig`
		<div
			data-application-config
			data-hub-url="{{ settings.hubUrl }}"
			data-api-url="{{ settings.apiUrl }}"
			data-debug-enabled="{{ settings.isDebug }}"
			hidden></div>
        <div data-module-view></div>
	`;

    override onInitialize(id: string, target: { 0: HTMLElement }, properties: any, meta: any) {
        this.currentApp = bootstrApp.init(id, target[0], properties, meta);
	}

	onRender(
        id: string,
        target: { 0: HTMLElement },
        items: any,
        properties: any,
        meta: any
    ): void {
        this.currentApp = bootstrApp.instances.get(id);
        
        const application = this.application;
        if (!application) return;
        
        if (!application.rendered) {
            const renderTarget = target[0].querySelector<HTMLElement>(
                "[data-module-view]"
            );
            
            if (renderTarget) {
                application.render(renderTarget, items, properties, meta);
            }
        }
        
        if (!application.isDebug) return;
        
        let debugTarget = target[0].querySelector<HTMLElement>(
            "[data-xibo-modules-debug]"
        );
        
        if (!debugTarget) {
            debugTarget = document.createElement("div");
            debugTarget.dataset.xiboModulesDebug = "";
            
            debugTarget.style.cssText = `
                position:absolute;
                left:0;
                right:0;
                bottom:0;
                z-index:9999;
                padding:20px;
                background:rgba(17,17,17,0.9);
                color:#00ff88;
                font-family:monospace;
                font-size:12px;
                pointer-events:none;
            `;

            target[0].append(debugTarget);

            application.renderDebugInfo(debugTarget);
        }

        application.debugUpdate(id);
    }
}