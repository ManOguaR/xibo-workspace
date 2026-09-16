import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build as viteBuild } from "vite";

import { 
    BootstrapDiscovery, 
    JsonObject,
    ValidationIssue, 
    XiboModuleDefinition, 
    XiboModuleDefinitionBuilder, 
    XiboModuleXmlGenerator, 
    XiboModuleTemplateXmlGenerator,
    XiboDatatypeXmlGenerator } from "../build/xibo-build.js";

export async function runBuildCommand(): Promise<void> {
    const projectRoot = process.cwd();

    const packageJsonPath = resolve(projectRoot, "package.json");

    const packageJson = JSON.parse(
        await readFile(packageJsonPath, "utf8")) as { 
            name?: string; 
            build?: {
                singleFileTemplates?: boolean;
            };
        };

    if (typeof packageJson.name !== "string" || packageJson.name.length === 0) {
        throw new Error("Package name is required.");
    }
    const packageName = normalizePackageName(packageJson.name);

    const singleFileTemplates = packageJson.build?.singleFileTemplates;
    if (singleFileTemplates !== undefined && typeof singleFileTemplates !== "boolean") {
        throw new Error("Build setting 'singleFileTemplates' must be a boolean.");
    }

    //
    // 1. Discover bootstrap definition sources
    //    
    const discovery = new BootstrapDiscovery(resolve(projectRoot, ".bootstrap"));

    const bootstrap = await discovery.discover();
    
    if (bootstrap.hasErrors()) {
        throw new BuildValidationError(bootstrap.issues);
    }
    bootstrap.log();
    
    //
    // 2. Prepare and build the Xibo module definition
    //
    const builder = new XiboModuleDefinitionBuilder();
    const moduleDefinition = builder.addBootstrap(bootstrap).build();

    //
    // 3. Compile non-bootstrap project sources
    //
    let compilation;

    const app = moduleDefinition.companionAppDefinition;
    if (app !== undefined) {
        compilation = await viteBuild({
            root: projectRoot,
            configFile: false,
            input: app.entrypoint,
            build: {
                outDir: `.xibo/dist/${moduleDefinition.type}/assets`,
                emptyOutDir: true,
                rolldownOptions: {
                    output: {
                        codeSplitting: false,
                        entryFileNames: `${packageName}.min.js`
                    }
                }
            }            
        });
    }

    //
    // 4. Run build transformations / user tasks
    //
    if (compilation !== undefined) {
        // TODO: identify Vite entry output as Xibo asset
        // TODO: emit development asset: <appname>.js
        // TODO: minify development asset
        // TODO: emit production asset: <appname>.min.js
    }

    //
    // n-2. Collect final module resources
    //
    // const resources = await collectResources({
    //     compilation,
    //     datatype,
    //     assets,
    //     provider,
    //     ...
    // });

    //
    // n-1. Emit Xibo definitions
    //
    const manifest = await emitXiboModule(
        moduleDefinition,
        !(singleFileTemplates ?? false)
    );

    //
    // n. Package final Xibo module
    //
    await packageModule(manifest);

    console.log("Xibo module definition ingested:");
    console.log(moduleDefinition);
}

async function emitXiboModule(
    definition: XiboModuleDefinition,
    multiFile: boolean = true,
    output: string = resolve(process.cwd(), ".xibo")
): Promise<JsonObject> {
    await mkdir(output, {
        recursive: true
    });

    const distRoot = resolve(output, "dist");
    const modulesRoot = resolve(distRoot, "modules");
    await mkdir(modulesRoot, { recursive: true });
    const datatypesRoot = resolve(modulesRoot, "datatypes");
    await mkdir(datatypesRoot, { recursive: true });
    const templatesRoot = resolve(modulesRoot, "templates");
    await mkdir(templatesRoot, { recursive: true });
    const manifest: JsonObject = {};

    //
    // Module
    //
    const modulePath = resolve(
        modulesRoot,
        `${definition.type.toLowerCase()}.xml`
    );

    await writeFile(
        modulePath,
        new XiboModuleXmlGenerator()
            .generate(definition),
        "utf8"
    );

    manifest["module"] = modulePath;

    //
    // Datatype
    //
    const datatype = definition.datatypeDefinition;

    if (datatype !== undefined) {
        const datatypePath = resolve(
            datatypesRoot,
            `${datatype.id}.xml`
        );

        await writeFile(
            datatypePath,
            new XiboDatatypeXmlGenerator()
                .generate(datatype),
            "utf8"
        );

        manifest["datatype"] = datatypePath;
    }

    //
    // Templates
    //
    if (definition.templateDefinitions.length > 0) {
        if (datatype === undefined) {
            throw new Error(`Module '${definition.id}' defines templates but has no datatype.`);
        }
        
        if (multiFile) {
            
            //
            // Multi-file
            //
            const templateGenerator = new XiboModuleTemplateXmlGenerator();
            
            for (const templateDefinition of definition.templateDefinitions) {
                const templatePath = resolve(
                    templatesRoot,
                    `${templateDefinition.id.replaceAll("_", "-")}-${templateDefinition.type}.xml`
                );
                
                await writeFile(
                    templatePath,
                    templateGenerator.generateTemplate(
                        templateDefinition,
                        datatype.id
                    ),
                    "utf8"
                );
                
                manifest[`template:${templateDefinition.id}`] = templatePath;
            }
        }
        else {

            //
            // Single-file
            //
            const templatesPath = resolve(
                templatesRoot,
                `${definition.type.toLowerCase()}.xml`
            );

            await writeFile(
                templatesPath,
                new XiboModuleTemplateXmlGenerator()
                    .generateTemplates(
                        definition.templateDefinitions,
                        datatype?.id
                    ),
                "utf8"
            );

            manifest["templates"] = templatesPath;
        }
    }

    //
    // Manifest
    //
    await writeFile(
        resolve(output, "manifest.json"),
        JSON.stringify(
            manifest,
            null,
            2
        ),
        "utf8"
    );

    return manifest;
}

async function packageModule(
    manifest: JsonObject, 
    output: string = resolve(process.cwd(), ".xibo")
) {
    
}

export class BuildValidationError extends Error {
    constructor(
        public readonly issues: ValidationIssue[]
    ) {
        super("Build validation failed.");
    }
}

function normalizePackageName(
    name: string
): string {
    const packageName = name.includes("/")
        ? name.substring(name.lastIndexOf("/") + 1)
        : name;

    return packageName
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}