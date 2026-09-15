import { JsonObject } from "../private-types.js";

export class XiboModuleDefinition {
    public id: string;
    public name: string;

    public templateDefinitions: XiboModuleTemplateDefinition[] = [];

    public datatypeDefinition?: XiboDatatypeDefinition;

    public constructor(
        id: string,
        name: string) {
            this.id = id;
            this.name = name;
    }
}

export class XiboModuleTemplateDefinition {
    public id: string;
    public name: string;

    public constructor(
        id: string,
        name: string) {
            this.id = id;
            this.name = name;
    }
}

export class XiboDatatypeDefinition {

    public constructor(
        public id: string,
        public name: string
    ) {
    }

}