import {
    cp,
    mkdir,
    readdir,
    readFile,
    writeFile
} from "node:fs/promises";

import {
    dirname,
    resolve
} from "node:path";

import {
    fileURLToPath
} from "node:url";

import {
    addCompanionApp
} from "./application.js";

export async function runNewCommand(
    args: string[]
): Promise<void> {
    const packageRoot = getPackageRoot();

    const projectTemplatesRoot = resolve(
        packageRoot,
        "templates",
        "projects"
    );

    const templates = await getTemplates(
        projectTemplatesRoot
    );

    let template: string;
    let name: string;
    let target: string;
    let companionApp = false;

    switch (args.length) {
        case 2:
            [name, target] = args;
            template = "empty";
            companionApp = true;
            break;

        case 3:
            [template, name, target] = args;
            break;

        default:
            await printUsage();
            process.exit(1);
    }

    const requestedTemplate = template;
    const helloWorld = template === "hello-world";

    if (helloWorld) {
        template = "stencil";
    }

    if (!templates.includes(template)) {
        throw new Error(
            `Unknown project template '${requestedTemplate}'. ` +
            `Available templates: ${templates.join(", ")}, hello-world`
        );
    }

    const templateRoot = resolve(
        projectTemplatesRoot,
        template
    );

    const targetRoot = resolve(
        process.cwd(),
        target
    );

    const bootstrapRoot = resolve(
        targetRoot,
        ".bootstrap"
    );

    await mkdir(targetRoot, {
        recursive: true
    });

    await mkdir(bootstrapRoot, {
        recursive: true
    });

    const entries = await readdir(
        templateRoot,
        {
            withFileTypes: true
        }
    );

    for (const entry of entries) {
        const source = resolve(
            templateRoot,
            entry.name
        );

        if (entry.name === "module.ts") {
            await cp(
                source,
                resolve(
                    bootstrapRoot,
                    "module.ts"
                )
            );

            continue;
        }

        await cp(
            source,
            resolve(
                targetRoot,
                entry.name
            ),
            {
                recursive: true
            }
        );
    }
    
    const moduleId = toIdName(name);
    const moduleName = toTypeName(name);

    const moduleFile = resolve(
        bootstrapRoot,
        "module.ts"
    );

    const moduleSource = await readFile(
        moduleFile,
        "utf8"
    );

    await writeFile(
        moduleFile,
        moduleSource.replaceAll(
            "__MODULE_NAME__",
            moduleName
        )
    );

    if (helloWorld) {
        await writeFile(
            resolve(
                targetRoot,
                "index.html"
            ),
            `<div>
    <h1>Hello World</h1>
</div>
`
        );
    }

    const packageJson = {
        name,
        version: "1.0.0",
        private: true,
        type: "module",
        xibo: {
            id: moduleId,
            name: moduleName
        },
        devDependencies: {
            "xibo-modules": "^1.0.0"
        }
    };

    await writeFile(
        resolve(
            targetRoot,
            "package.json"
        ),
        JSON.stringify(
            packageJson,
            null,
            2
        ) + "\n"
    );

    if (companionApp) {
        await addCompanionApp(
            targetRoot
        );
    }

    console.log(
        `Created '${moduleId}' from '${requestedTemplate}' template at ${targetRoot}`
    );
}

export async function runAddCommand(
    args: string[]
): Promise<void> {
    const packageRoot = getPackageRoot();

    const addTemplatesRoot = resolve(
        packageRoot,
        "templates",
        "add"
    );

    const templates = await getTemplates(
        addTemplatesRoot
    );

    let template: string;
    let name: string;
    let folder: string | undefined;

    switch (args.length) {
        case 2:
            [template, name] = args;
            break;

        case 3:
            [template, name, folder] = args;
            break;

        default:
            await printUsage();
            process.exit(1);
    }

    if (!templates.includes(template)) {
        throw new Error(
            `Unknown add template '${template}'. ` +
            `Available templates: ${templates.join(", ")}`
        );
    }

    const bootstrapRoot = resolve(
        process.cwd(),
        ".bootstrap"
    );

    const targetRoot = folder
        ? resolve(
            bootstrapRoot,
            folder
        )
        : bootstrapRoot;

    await mkdir(targetRoot, {
        recursive: true
    });

    const templateFile = resolve(
        addTemplatesRoot,
        template,
        "template.ts"
    );

    const source = await readFile(
        templateFile,
        "utf8"
    );

    const templateId = toTemplateIdName(name);
    const templateName = toTypeName(name);

    const targetFile = resolve(
        targetRoot,
        `${templateName}.ts`
    );

    await writeFile(
        targetFile,
        source.replaceAll(
            "__TEMPLATE_NAME__",
            templateName
        )
    );

    const packageJsonPath = resolve(
        process.cwd(),
        "package.json"
    );

    const packageJson = JSON.parse(
        await readFile(
            packageJsonPath,
            "utf8"
        )
    );

    packageJson.xibo ??= {};
    packageJson.xibo[templateId] = {
        name: templateName
    };

    await writeFile(
        packageJsonPath,
        JSON.stringify(
            packageJson,
            null,
            2
        ) + "\n"
    );

    console.log(
        `Added '${template}' '${templateId}' at ${targetFile}`
    );
}

export async function printUsage(): Promise<void> {
    const packageRoot = getPackageRoot();

    const projectTemplates = await getTemplates(
        resolve(
            packageRoot,
            "templates",
            "projects"
        )
    );

    const addTemplates = await getTemplates(
        resolve(
            packageRoot,
            "templates",
            "add"
        )
    );

    console.log(`
Usage:
  xibo new <name> <target>
  xibo new <template> <name> <target>

  xibo add <type> <name>
  xibo add <type> <name> <folder>

  xibo build

Default project template:
  empty

Project templates:
${projectTemplates
    .map(template => `  ${template}`)
    .join("\n")}

Convenience:
  hello-world

Add templates:
${addTemplates
    .map(template => `  ${template}`)
    .join("\n")}
`);
}

async function getTemplates(
    templatesRoot: string
): Promise<string[]> {
    const entries = await readdir(
        templatesRoot,
        {
            withFileTypes: true
        }
    );

    return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
}

function getPackageRoot(): string {
    return resolve(
        dirname(
            fileURLToPath(import.meta.url)
        ),
        "..",
        ".."
    );
}

function toIdName(
    name: string
): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}

function toTemplateIdName(
    name: string
): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
}

function toTypeName(
    name: string
): string {
    return toIdName(name)
        .split("-")
        .filter(Boolean)
        .map(part =>
            part.charAt(0).toUpperCase() +
            part.slice(1)
        )
        .join("");
}