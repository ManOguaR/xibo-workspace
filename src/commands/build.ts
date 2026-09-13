import { resolve } from "node:path";
import { BootstrapDiscovery } from "../build/xibo-build.js";


export async function runBuildCommand(): Promise<void> {
    const projectRoot = process.cwd();

    //
    // 1. Discover bootstrap definition sources
    //
    const discovery = new BootstrapDiscovery(
        resolve(projectRoot, ".bootstrap")
    );

    const bootstrap = await discovery.discover();

    //
    // 2. Validate and ingest the Xibo module definition
    //
    // const ingestor = new ModuleIngestor(projectRoot);
    // const moduleDefinition = await ingestor.ingest(bootstrap);

    //
    // 3. Compile non-bootstrap project sources
    //
    // const compilation = await compileProjectSources(...);

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
    console.log(bootstrap);
}