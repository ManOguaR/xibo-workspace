import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { DevServer } from "../developer/xibo-player/dev-server.js";


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

    const server = new DevServer({
        root: runRoot,
        targetId
    });

    await server.start();
}


async function prepareRunDirectory(): Promise<string> {
    const runRoot = resolve(
        tmpdir(),
        "xibo-workspace",
        "run"
    );

    await rm(
        runRoot,
        {
            recursive: true,
            force: true
        }
    );

    await mkdir(
        runRoot,
        {
            recursive: true
        }
    );

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
        throw new Error(`Build output not found: ${buildRoot}`);
    }

    if (!buildInfo.isDirectory()) {
        throw new Error(`Build output is not a directory: ${buildRoot}`);
    }

    const entries = await readdir(
        buildRoot,
        {
            withFileTypes: true
        }
    );

    for (const entry of entries) {
        await cp(
            resolve(
                buildRoot,
                entry.name
            ),
            resolve(
                runRoot,
                entry.name
            ),
            {
                recursive: true
            }
        );
    }
}


// // src/commands/run.ts

// import { dirname, resolve } from "node:path";

// import { fileURLToPath } from "node:url";

// import { DevServer } from "../developer/xibo-player/dev-server.js";

// export async function runRunCommand(
//     args: string[]
// ): Promise<void> {
//     if (args.length > 1) {
//         throw new Error("Usage: xibo run [id]");
//     }

//     const targetId = args[0];
//     const projectRoot = process.cwd();

//     const packageRoot = resolve(
//         dirname(fileURLToPath(import.meta.url)),
//         "..",
//         ".."
//     );

//     const playerRoot = resolve(
//         packageRoot,
//         "src",
//         "developer",
//         "xibo-player"
//     );

//     const server = new DevServer(
//         output,
//         targetId
//     );

//     await server.start();
// }