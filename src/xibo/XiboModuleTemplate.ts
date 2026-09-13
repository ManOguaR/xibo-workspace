export type XiboModuleTemplateType =
    | "static"
    | "element";

export abstract class XiboModuleTemplate {
    abstract readonly type: XiboModuleTemplateType;
}

export abstract class XiboStaticTemplate extends XiboModuleTemplate {
    readonly type = "static";
}

export abstract class XiboElementTemplate extends XiboModuleTemplate {
    readonly type = "element";
}