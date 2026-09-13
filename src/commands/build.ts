import { createServer } from "vite";

export async function runBuildCommand(): Promise<void> {
    const projectRoot = process.cwd();
    const bootstrapFile = "/.bootstrap/module.ts";

    const vite = await createServer({
        root: projectRoot,
        server: {
            middlewareMode: true
        },
        appType: "custom"
    });

    try {
        const loaded = await vite.ssrLoadModule(
            bootstrapFile
        );

        if (!loaded.default) {
            throw new Error(
                ".bootstrap/module.ts must export a default XiboModule class."
            );
        }

        const ModuleType = loaded.default;
        const module = new ModuleType();

        console.log("Loaded Xibo module:");
        console.log(module);
    }
    finally {
        await vite.close();
    }
}