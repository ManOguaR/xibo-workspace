import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DevServer } from "../developer/dev-server.js";
import { XiboWidgetRenderer, XiboXmlParser } from "../developer/xml-module-parser.js";


export async function runRunCommand(
    args: string[]
): Promise<void> {

    if (args.length > 1) {
        throw new Error("Usage: xibo run [id]");
    }

    const projectRoot = process.cwd();
    const targetId = args[0];

    const runRoot = await prepareRunDirectory();

    await collectBuildOutput(
        projectRoot,
        runRoot
    );


    const xmlPath = await resolveTarget(
        projectRoot,
        runRoot,
        targetId
    );

    // Recursos propios del entorno de desarrollo.
    const packageRoot = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../.."
    );

    const playerRoot = resolve(
        packageRoot,
        "src",
        "developer",
        "xibo-player"
    );

    await cp(
        resolve(playerRoot, "bundle.min.js"),
        resolve(runRoot, "bundle.min.js")
    );

    await cp(
        resolve(playerRoot, "fonts.css"),
        resolve(runRoot, "fonts.css")
    );

    // XML compilado → HTML.
    const renderer = new XiboWidgetRenderer();

    const html = await renderer.render(
        xmlPath,
        runRoot,
        resolve(playerRoot, "widget-html-render.twig"),
        {
            templateId: targetId
        }
    );

    await writeFile(
        resolve(runRoot, "index.html"),
        html,
        "utf8"
    );

    await copyLibrary(projectRoot, runRoot);
    
    // Servir el HTML generado.
    const server = new DevServer({
        root: runRoot,
        targetId
    });

    await server.start();
}


async function resolveTarget(
    projectRoot: string,
    runRoot: string,
    targetId?: string
): Promise<string> {

    const manifestPath = resolve(
        projectRoot,
        ".xibo",
        "manifest.json"
    );

    const manifest = JSON.parse(
        await readFile(manifestPath, "utf8")
    ) as Record<string, string | undefined>;

    if (!manifest.module) {
        throw new Error(
            "Build manifest has no module entry."
        );
    }

    const modulesRoot = resolve(runRoot, "modules");

    const modulePath = resolve(
        modulesRoot,
        basename(manifest.module)
    );

    const parser = new XiboXmlParser();
    const moduleXml = await parser.loadModule(modulePath);

    // Sin ID, o con el ID del módulo: module only.
    if (!targetId || targetId === String(moduleXml.id)) {
        return modulePath;
    }

    // Template individual o fichero conjunto de templates.
    const templateEntry =
        manifest[`template:${targetId}`]
        ?? manifest.templates;

    if (!templateEntry) {
        throw new Error(
            `Unknown Xibo module/template: ${targetId}`
        );
    }

    const templatePath = resolve(
        modulesRoot,
        "templates",
        basename(templateEntry)
    );

    // Comprueba que el ID existe también dentro del XML.
    await parser.loadTemplate(
        templatePath,
        targetId
    );

    return templatePath;
}


async function prepareRunDirectory(): Promise<string> {

    const runRoot = resolve(
        tmpdir(),
        "xibo-workspace",
        "run"
    );

    await rm(runRoot, {
        recursive: true,
        force: true
    });

    await mkdir(runRoot, {
        recursive: true
    });

    return runRoot;
}


async function collectBuildOutput(
    projectRoot: string,
    runRoot: string
): Promise<void> {

    const buildRoot = resolve(
        projectRoot,
        ".xibo",
        "dist"
    );

    let buildInfo;

    try {
        buildInfo = await stat(buildRoot);
    }
    catch {
        throw new Error(
            `Build output not found: ${buildRoot}`
        );
    }

    if (!buildInfo.isDirectory()) {
        throw new Error(
            `Build output is not a directory: ${buildRoot}`
        );
    }

    const entries = await readdir(buildRoot, {
        withFileTypes: true
    });

    for (const entry of entries) {
        await cp(
            resolve(buildRoot, entry.name),
            resolve(runRoot, entry.name),
            {
                recursive: true
            }
        );
    }
}

async function copyLibrary(
    projectRoot: string,
    runRoot: string
): Promise<void> {
    const libraryRoot = resolve(projectRoot, ".bootstrap", "library");

    let entries;
    try {
        entries = await readdir(libraryRoot, { withFileTypes: true });
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return;
        }
        throw error;
    }

    for (const entry of entries) {
        await cp(
            resolve(libraryRoot, entry.name),
            resolve(runRoot, entry.name),
            {
                recursive: true,
                force: false,
                errorOnExist: true
            }
        );
    }
}