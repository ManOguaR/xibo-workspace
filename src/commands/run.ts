import { createServer } from "vite";

export async function runRunCommand(): Promise<void> {
    const projectRoot = process.cwd();

    const server = await createServer({
        root: projectRoot,
        mode: "development"
    });

    await server.listen();

    server.printUrls();
    server.bindCLIShortcuts({
        print: true
    });
}