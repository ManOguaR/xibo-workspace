// src/developer/xibo-player/dev-server.ts

import { createServer } from "vite";

export interface DevServerOptions {
    root: string;
    targetId?: string;
}

export class DevServer {
    public constructor(
        private readonly options: DevServerOptions
    ) {
    }

    public async start(): Promise<void> {
        const server = await createServer({
            root: this.options.root,
            configFile: false,
            mode: "development"
        });

        await server.listen();

        server.printUrls();

        server.bindCLIShortcuts({
            print: true
        });
    }
}
