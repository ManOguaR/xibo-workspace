import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build as viteBuild } from "vite";

interface PackageJson {
    xibo?: {
        [key: string]: unknown;
        vite?: string;
    };

    devDependencies?: {
        [key: string]: string;
    };
}

export async function runAppCommand(
    args: string[]
): Promise<void> {

    if (args.length !== 1) {
        printAppUsage();
        process.exit(1);
    }

    switch (args[0]) {
        case "add":
            await addCompanionApp(
                process.cwd()
            );
            break;

        case "build":
            await runAppBuildCommand();
            break;

        default:
            printAppUsage();
            process.exit(1);
    }
}

export async function addCompanionApp(
    projectRoot: string
): Promise<void> {
    const packageJsonPath = resolve(
        projectRoot,
        "package.json"
    );

    const packageJson = JSON.parse(
        await readFile(
            packageJsonPath,
            "utf8"
        )
    ) as PackageJson;

    packageJson.xibo ??= {};

    if (packageJson.xibo.vite !== undefined) {
        throw new Error("A companion application has already been added.");
    }

    const sourceRoot = resolve(
        projectRoot,
        "src"
    );

    const entrypoint = resolve(
        sourceRoot,
        "main.ts"
    );

    try {
        await access(entrypoint);

        throw new Error("Companion application entrypoint 'src/main.ts' already exists.");
    }
    catch (error) {
        if (
            error instanceof Error &&
            error.message ===
                "Companion application entrypoint 'src/main.ts' already exists."
        ) {
            throw error;
        }
    }

    const modulePath = resolve(projectRoot, ".bootstrap", "module.ts");
    const moduleSource = await readFile(modulePath, "utf8");

    if (/\bextends\s+XiboModuleBase\b/.test(moduleSource)) {
        await writeFile(
            modulePath,
            moduleSource.replaceAll("XiboModuleBase", "XiboModule")
        );
    } else if (!/\bextends\s+XiboModule\b/.test(moduleSource)) {
        throw new Error(
            "The module must extend XiboModuleBase or XiboModule."
        );
    }

    await mkdir(
        sourceRoot,
        {
            recursive: true
        }
    );

    await writeFile(
        resolve(
            sourceRoot,
            "vite-env.d.ts"
        ),
        `/// <reference types="vite/client" />\n`
    );

    await writeFile(
        resolve(sourceRoot, "MyApplication.ts"),
        `import { XiboModuleApplication } from "xibo-modules/app";

export class MyApplication extends XiboModuleApplication {
    override render(
        target: HTMLElement,
        items: any,
        properties: any,
        meta: any
    ): void {
        this.rendered = true;
    }
}
`
    );
    
    await writeFile(
        entrypoint,
        `import { bootstrApp } from "xibo-modules/app";
import { MyApplication } from "./MyApplication.js";

bootstrApp.register(MyApplication);
`
    );

    packageJson.xibo.vite = "src/main.ts";

    packageJson.devDependencies ??= {};
    packageJson.devDependencies["vite"] = "^8.3.0";

    await writeFile(
        packageJsonPath,
        JSON.stringify(
            packageJson,
            null,
            2
        ) + "\n"
    );

    console.log(
        "Companion application added at src/main.ts"
    );
}

async function runAppBuildCommand(): Promise<void> {
    const projectRoot = process.cwd();

    const packageJsonPath = resolve(
        projectRoot,
        "package.json"
    );

    const packageJson = JSON.parse(
        await readFile(
            packageJsonPath,
            "utf8"
        )
    ) as PackageJson;

    const entrypoint = packageJson.xibo?.vite;

    if (typeof entrypoint !== "string") {
        throw new Error(
            "No companion application is configured."
        );
    }

    await viteBuild({
        root: projectRoot,
        configFile: false,
        input: entrypoint
    });
}

function printAppUsage(): void {
    console.log(`
Usage:
  xibo app add
  xibo app build
`);
}