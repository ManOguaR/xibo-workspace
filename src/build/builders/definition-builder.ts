
import { XiboModule, XiboModuleTemplate } from "xibo-modules";

import { BootstrapDiscoveryResult, JsonObject } from "../private-types.js";

import { CompanionAppDefinition, XiboModuleDefinition, XiboModuleTemplateDefinition, XiboDatatypeDefinition } from './module-definition.js';

export class XiboModuleDefinitionBuilder {
    private moduleDefinition?: XiboModuleDefinition;
    private xiboModule? : XiboModule;
    private readonly xiboModuleTemplates: XiboModuleTemplate[] = [];
    
    public addBootstrap(
        bootstrap: BootstrapDiscoveryResult
    ): XiboModuleDefinitionBuilder {
        const templateEntries = bootstrap.templates.map(template => {
            const entry = Object.entries(bootstrap.metadata).find(
                ([id, value]) =>
                    typeof value === "object" &&
                    value !== null &&
                    !Array.isArray(value) &&
                    this.toClassName(id) === template.constructor.name
            );
            
            if (entry === undefined) {
                throw new Error(`Metadata for template '${template.constructor.name}' not found.`);
            }
            
            return {
                template,
                id: entry[0],
                metadata: {
                    [entry[0]]: entry[1]
                }
            };
        });
        
        if (bootstrap.module !== undefined) {
            const templateIds = new Set(templateEntries.map(entry => entry.id));
            
            const moduleMetadata = Object.fromEntries(
                Object.entries(bootstrap.metadata).filter(
                    ([key]) => key !== "datatype" && !templateIds.has(key)
                )
            );
            
            this.addModule(
                bootstrap.module,
                moduleMetadata
            );
        }
        
        for (const entry of templateEntries) {
            this.addTemplate(
                entry.template,
                entry.metadata
            );
        }
        
        const datatype = bootstrap.metadata["datatype"];
        
        if (
            typeof datatype === "object" &&
            datatype !== null &&
            !Array.isArray(datatype)
        ) {
            this.addDatatype(datatype);
        }
        
        const vite = bootstrap.metadata["vite"];
        if (typeof vite === "string") {
            this.addApplication(vite);
        }
        
        return this;
    }

    public addModule(
        module: XiboModule,
        metadata: JsonObject
    ): XiboModuleDefinitionBuilder {
        if(this.moduleDefinition !== undefined && this.xiboModule !== undefined) {
            throw new Error("A module has already been added.");
        }
        
        const id = metadata["id"];
        const name = metadata["name"];
        
        if (typeof id !== "string") {
            throw new Error("Module metadata 'id' is required.");
        }
        
        if (typeof name !== "string") {
            throw new Error("Module metadata 'name' is required.");
        }
        
        const definition = new XiboModuleDefinition(
            id,
            name,
            this.getModuleType(module)
        );

        this.assignMetadata(
            definition,
            metadata
        );
        
        this.moduleDefinition = definition;
        this.xiboModule = module;
        return this;
    }
    
    public addTemplate(
        template: XiboModuleTemplate,
        metadata: JsonObject
    ): XiboModuleDefinitionBuilder {
        
        if (this.xiboModuleTemplates.some(current => current.constructor.name === template.constructor.name)) {
            throw new Error(`Template '${template.constructor.name}' has already been added.`);
        }
        
        const moduleDefinition = this.ensureModule();
        
        const {
            id,
            metadata: templateMetadata
        } = this.resolveMetadata(metadata);
        
        const name = templateMetadata["name"];
        
        if (typeof name !== "string") {
            throw new Error(`Template metadata '${id}.name' is required.`);
        }
        
        const definition = new XiboModuleTemplateDefinition(
            id,
            name,
            template.type
        );
        
        this.assignMetadata(
            definition,
            templateMetadata
        );
        
        moduleDefinition.templateDefinitions.push(
            definition
        );

        this.xiboModuleTemplates.push(template);        
        return this;
    }
    
    public addDatatype(
        datatype: JsonObject
    ): XiboModuleDefinitionBuilder {
        const moduleDefinition = this.ensureModule();
        
        if (moduleDefinition.datatypeDefinition !== undefined) {
            throw new Error("A datatype has already been added.");
        }
        
        const {
            id,
            metadata: datatypeMetadata
        } = this.resolveMetadata(datatype);
        
        const name = datatypeMetadata["name"];

        if (typeof name !== "string") {
            throw new Error(`Datatype metadata '${id}.name' is required.`);
        }
        
        const definition = new XiboDatatypeDefinition(
            id,
            name
        );
        
        this.assignMetadata(
            definition,
            datatypeMetadata
        );
        
        moduleDefinition.datatypeDefinition = definition;        
        return this;
    }

    public addApplication(
        entrypoint: string
    ): XiboModuleDefinitionBuilder {
        const moduleDefinition = this.ensureModule();
        
        if (moduleDefinition.companionAppDefinition !== undefined) {
            throw new Error("A companion application has already been added.");
        }
        
        moduleDefinition.companionAppDefinition =
            new CompanionAppDefinition(
                entrypoint
        );
        
        return this;
    }

    public build() : XiboModuleDefinition {
        const moduleDefinition = this.ensureModule();

        this.ensureDatatype();
        // this.ensureProvider();

        // construir resultado final

        const builtDefinition = moduleDefinition;

        return builtDefinition;
    }

    private resolveMetadata(
        metadata: JsonObject
    ): {
        id: string;
        metadata: JsonObject;
    } {
        const id = metadata["id"];
        if (typeof id === "string") {
            return {
                id,
                metadata
            };
        }
        
        const entries = Object.entries(metadata);
        
        if (entries.length !== 1) {
            throw new Error("Metadata must contain an 'id' or a single keyed definition.");
        }
        
        const [key, value] = entries[0];
        
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw new Error(`Metadata definition '${key}' must be an object.`);
        }
        
        return {
            id: key,
            metadata: value
        };
    }

    private assignMetadata(
        target: object,
        metadata: JsonObject
    ): void {
        for (const [key, value] of Object.entries(metadata)) {
            if (key in target) {
                (target as Record<string, unknown>)[key] = value;
            }
        }
    }

    private ensureModule(): XiboModuleDefinition  {
        if (this.moduleDefinition === undefined) {
            throw new Error("Module definition has not been initialized.");
        }
        if (this.xiboModule === undefined) {
            throw new Error("Module class not found.");
        }
        
        return this.moduleDefinition;
    }

    private ensureDatatype(): void {
        const moduleDefinition = this.ensureModule();
        
        if (
            moduleDefinition.datatypeDefinition === undefined &&
            moduleDefinition.templateDefinitions.length > 0
        ) {
            this.addDatatype({
                id: this.getDefaultDatatypeId(moduleDefinition.id),
                name: this.toClassName(moduleDefinition.name)
            });
    }
    }

    // private ensureProvider(...): void {
    //     // paso reservado
    //     // empty provider pendiente de traer su template
    // }

    private getDefaultDatatypeId(moduleId: string): string {
        return moduleId
            .replaceAll("-", "")
            .substring(0, 12);
    }

    private toClassName(value: string): string {
        return value
            .split(/[^a-zA-Z0-9]+/)
            .filter(Boolean)
            .map(part =>
                part.charAt(0).toUpperCase() +
                part.slice(1)
            )
            .join("");
    }

    private getModuleType(
        module: XiboModule
    ): string {
        return module.constructor.name
            .replace(/Module$/, "")
            .toLowerCase();
    }
}

export { XiboModuleDefinition, XiboModuleTemplateDefinition, XiboDatatypeDefinition }