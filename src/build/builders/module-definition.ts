import { JsonObject } from "../private-types.js";
import { XiboModuleTemplateType } from "../../xibo/XiboModuleTemplate.js";

export class XiboModuleDefinition {
    public author: string = "";
    public description: string = "";

    public templateDefinitions: XiboModuleTemplateDefinition[] = [];

    public datatypeDefinition?: XiboDatatypeDefinition;

    public companionAppDefinition?: CompanionAppDefinition;
    
    public constructor(
        public id: string,
        public name: string,
        public type: string) {
    }
}

export class XiboModuleTemplateDefinition {
    public datatypeId? : string;
    public constructor(
        public id: string,
        public name: string,
        public type: XiboModuleTemplateType) {
    }
}

export class XiboDatatypeDefinition {

    public constructor(
        public id: string,
        public name: string
    ) {
    }

}

export class CompanionAppDefinition {

    public constructor(
        public entrypoint: string
    ) {
    }

}