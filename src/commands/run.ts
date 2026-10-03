import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DevServer } from "../developer/dev-server.js";
import { XiboWidgetRenderer, XiboXmlParser } from "../developer/xml-module-parser.js";


export async function runRunCommand(
    args: string[]
): Promise<void> {

    const options = parseRunArguments(args);

    const projectRoot = process.cwd();
    const targetId = options.targetId;

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

    const renderer = new XiboWidgetRenderer();

    const html = await renderer.render(
        xmlPath,
        runRoot,
        resolve(playerRoot, "widget-html-render.twig"),
        {
            templateId: targetId,
            widgetId: options.widgetId
        }
    );

    await writeFile(
        resolve(runRoot, "index.html"),
        html,
        "utf8"
    );
    
    const favicon = "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" rx="12" fill="#101827"/>' +
        '<path d="M9 22 27 48 M27 22 9 48" fill="none" ' +
        'stroke="#f47652" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M35 48V27l9 11 9-11v21" fill="none" ' +
        'stroke="#1878f4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="38" cy="15" r="3" fill="white" stroke="#1878f4" stroke-width="1.5"/>' +
        '<circle cx="51" cy="15" r="3" fill="white" stroke="#1878f4" stroke-width="1.5"/>' +
        '</svg>'
    );

    await writeFile(
        resolve(runRoot, "index.html"),
        html.replace("</head>", `<link rel="icon" href="${favicon}">\n</head>`),
        "utf8"
    );

    await copyLibrary(projectRoot, runRoot);
    
    const server = new DevServer({
        root: runRoot,
        targetId,
        port: options.port
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

    const publicRoot = resolve(runRoot, "public");
    await mkdir(publicRoot, { recursive: true });

    for (const entry of entries) {
        await cp(
            resolve(libraryRoot, entry.name),
            resolve(publicRoot, entry.name),
            {
                recursive: true,
                force: false,
                errorOnExist: true
            }
        );
    }
}

interface RunOptions {
    targetId?: string;
    port?: number;
    widgetId?: number;
}

function parseRunArguments(
    args: string[]
): RunOptions {

    const options: RunOptions = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === "-port") {
            const value = args[++i];
            const port = Number(value);

            if (
                !Number.isInteger(port) ||
                port < 1 ||
                port > 65535
            ) {
                throw new Error(
                    `Invalid port: ${value}`
                );
            }

            options.port = port;
            continue;
        }

        if (arg === "-widget") {
            const value = args[++i];
            const widgetId = Number(value);

            if (
                !Number.isInteger(widgetId) ||
                widgetId < 1
            ) {
                throw new Error(
                    `Invalid widget id: ${value}`
                );
            }

            options.widgetId = widgetId;
            continue;
        }

        if (arg.startsWith("-")) {
            throw new Error(
                `Unknown option: ${arg}`
            );
        }

        if (options.targetId !== undefined) {
            throw new Error(
                "Usage: xibo run [id] [-port port] [-widget widgetId]"
            );
        }

        options.targetId = arg;
    }

    return options;
}