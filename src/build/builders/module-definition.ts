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
}

export class XiboModuleTemplateDefinition {
    public datatypeId?: string;

    public constructor(
        public id: string,
        public name: string,
        public type: XiboModuleTemplateType
    ) {
    }
}

export class XiboDatatypeDefinition {
    public constructor(
        public id: string,
        public name: string
    ) {
    }
}

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
