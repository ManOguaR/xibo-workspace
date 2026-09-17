import type { StencilSource } from "../resources/stencil.js";

export abstract class XiboModule {
    stencil?: StencilSource;

    preview?: StencilSource;
}    

export interface XiboModule {
    onInitialize?(id: string, target: HTMLElement, properties: any, meta: any): void;
    onParseData?(item: any, properties: any, meta: any): void;
    onDataLoad?(item: any, meta: any, properties: any, isDataReady: boolean): void;
    onRender?(id: string, target: HTMLElement, items: any, properties: any, meta: any): void;
    onVisible?(id: string, target: HTMLElement, items: any, properties: any, meta: any): void;
}