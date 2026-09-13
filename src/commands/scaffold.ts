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

    switch (args.length) {
        case 2:
            [name, target] = args;
            template = "empty";
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
            id: name,
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

    console.log(
        `Created '${name}' from '${requestedTemplate}' template at ${targetRoot}`
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

    const typeName = toTypeName(name);

    const targetFile = resolve(
        targetRoot,
        `${typeName}.ts`
    );

    await writeFile(
        targetFile,
        source.replaceAll(
            "__TEMPLATE_NAME__",
            typeName
        )
    );

    console.log(
        `Added '${template}' '${typeName}' at ${targetFile}`
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

function toTypeName(
    name: string
): string {
    return name
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map(part =>
            part.charAt(0).toUpperCase() +
            part.slice(1)
        )
        .join("");
}