import type { StencilSource } from "../resources/stencil.js";
import type { XiboPropertyGroups } from "../resources/properties.js";

export abstract class XiboModule {
    propertyGroups?: XiboPropertyGroups;
    preview?: StencilSource;
    stencil?: StencilSource;
}    

export interface XiboModule {
    onInitialize?(id: string, target: { 0: HTMLElement }, properties: any, meta: any): void;
    onParseData?(item: any, properties: any, meta: any): void;
    onDataLoad?(item: any, meta: any, properties: any, isDataReady: boolean): void;
    onRender?(id: string, target: { 0: HTMLElement }, items: any, properties: any, meta: any): void;
    onVisible?(id: string, target: { 0: HTMLElement }, items: any, properties: any, meta: any): void;
}