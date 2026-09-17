import { XiboModule, XiboModuleTemplate } from "xibo-modules";

export interface XiboPropertyDefinition {
    type: string;
    title?: string;
    helpText?: string;
    default?: string | number | boolean;
    group?: string;
}

export interface XiboPropertyMetadata extends XiboPropertyDefinition {
    id: string;
}

type Collection = "properties" | "settings";

interface PropertyCollections {
    properties: XiboPropertyMetadata[];
    settings: XiboPropertyMetadata[];
}

const registry = new WeakMap<object, PropertyCollections>();

export function registerProperty(
    collection: Collection,
    definition: XiboPropertyDefinition
) {
    return function<This extends object, Value>(
        _value: undefined,
        context: ClassFieldDecoratorContext<This, Value>
    ): void {
        if (typeof context.name !== "string") {
            throw new Error("Xibo properties require a string name.");
        }

        const id = context.name;

        context.addInitializer(function () {
            let collections = registry.get(this);

            if (collections === undefined) {
                collections = {
                    properties: [],
                    settings: []
                };

                registry.set(this, collections);
            }

            collections[collection].push({
                ...definition,
                id
            });
        });
    };
}

type ModuleProperties = PropertyCollections;

type TemplateProperties =
    Pick<PropertyCollections, "properties">;

export function getXiboPropertyDefinitions(
    instance: XiboModule
): ModuleProperties;

export function getXiboPropertyDefinitions(
    instance: XiboModuleTemplate
): TemplateProperties;

export function getXiboPropertyDefinitions(
    instance: XiboModule | XiboModuleTemplate
): ModuleProperties | TemplateProperties {

    const collections = registry.get(instance);

    const properties = [...(collections?.properties ?? [])];

    if (instance instanceof XiboModule) {
        return {
            properties,
            settings: [...(collections?.settings ?? [])]
        };
    }

    return { properties };
}

export interface XiboPropertyGroup {
    title: string;
    helpText?: string;
    expanded?: boolean;
}

// export type XiboPropertyGroups = Record<string, XiboPropertyGroup>;