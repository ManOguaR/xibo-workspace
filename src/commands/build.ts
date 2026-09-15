import { resolve } from "node:path";
import { build as viteBuild } from "vite";
import { BootstrapDiscovery, ValidationIssue, XiboModuleDefinitionBuilder } from "../build/xibo-build.js";

export async function runBuildCommand(): Promise<void> {
    //
    // 1. Discover bootstrap definition sources
    //    
    const projectRoot = process.cwd();
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
                outDir: ".xibo/dist",
                emptyOutDir: true
            }
        });
    }
    
    //
    // 4. Run build transformations / user tasks
    //
    // const transformed = await runBuildTasks(...);

    //
    // ...
    //

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
    // await emitModuleXml(moduleDefinition, resources);
    // await emitTemplateXml(...);
    // await emitDataTypeXml(...);

    //
    // n. Package final Xibo module
    //
    // await packageModule(...);

    console.log("Xibo module definition ingested:");
    console.log(moduleDefinition);
}

export class BuildValidationError extends Error {
    constructor(
        public readonly issues: ValidationIssue[]
    ) {
        super("Build validation failed.");
    }
}