import { JsonObject } from "../private-types.js";
import { ResolvedStencil, XiboPlayerHook } from "xibo-modules";

import { XiboModuleTemplateType } from "../../xibo/XiboModuleTemplate.js";

export type XiboShowIn =
    | "none"
    | "layout"
    | "playlist"
    | "both";

export interface XiboGroup {
    id: string;
    name: string;
    icon?: string;
}

export interface XiboInitialSize {
    width: number;
    height: number;
}

export class XiboModuleDefinition {
    public version: string = "1.0.0";
    public author: string = "";
    public description: string = "";

    public icon?: string;
    public group?: XiboGroup;

    public thumbnail?: string;
    public initialSize?: XiboInitialSize;
    public allowPreview: boolean = true;
    public showIn: XiboShowIn = "both";

    public datatypeDefinition?: XiboDatatypeDefinition;
    public cacheKey?: string;

    public preview?: ResolvedStencil;
    public stencil?: ResolvedStencil;

    public onInitialize?: XiboPlayerHook;
    public onDataLoad?: XiboPlayerHook;
    public onParseData?: XiboPlayerHook;
    public onRender?: XiboPlayerHook;
    public onVisible?: XiboPlayerHook;

    public assets: XiboAssetDefinition[] = [];

    public templateDefinitions: XiboModuleTemplateDefinition[] = [];

    public companionAppDefinition?: CompanionAppDefinition;

    public constructor(
        public id: string,
        public name: string,
        public type: string
    ) {
    }

    // 
    // settings
    // properties
    // propertyGroups

    // 
    // fallbackData
    // sampleData

    // 
    // requiredElements

    // 
    // compatibilityClass
    // validatorClass
}

export class XiboModuleTemplateDefinition {
    public datatypeId?: string;

    public description: string = "";
    public icon?: string;
    public thumbnail?: string;

    public isVisible: boolean = true;
    public showIn: XiboShowIn = "both";
    
    public initialSize?: XiboInitialSize;
    public hasDimensions: boolean = true;
    public canRotate: boolean = false;

    public stencil?: ResolvedStencil;
    public assets: XiboAssetDefinition[] = [];

    public onTemplateRender?: XiboPlayerHook;
    public onTemplateVisible?: XiboPlayerHook;
    public onElementParseData?: XiboPlayerHook;

    public constructor(
        public id: string,
        public name: string,
        public type: XiboModuleTemplateType
    ) {
    }

    // 
    // properties
    // propertyGroups

    // 
    // extends
}

export class XiboDatatypeDefinition {
    public fields: XiboDatatypeField[] =[]
    public constructor(
        public id: string,
        public name: string
    ) {
    }
}

///PLACEHOLDER
export class XiboDatatypeField {
    public isRequired: boolean = false;

    public constructor(
        public id: string,
        public type: string,
        public title: string,
    ) {
    }
}
///PLACEHOLDER

export class XiboAssetDefinition {
    public alias?: string;
    public cmsOnly?: boolean;
    public isAutoInclude: boolean = true;

    public constructor(
        public id: string,
        public type: string,
        public mimeType: string,
        public path: string
    ) {
    }
}

export class CompanionAppDefinition {
    public constructor(
        public entrypoint: string
    ) {
    }
}
