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
            mode: "development",
            plugins: [{
                name: "xibo-player-mock",
                configureServer(server) {
                    server.middlewares.use("/info", (req, res, next) => {
                        if (req.method !== "GET") {
                            return next();
                        }
                        
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json; charset=utf-8");
                        res.end(JSON.stringify({
                            hardwareKey: "xibo-modules-mock-player",
                            displayName: "Xibo Mock Player",
                            timeZone: "Europe/Madrid",
                            latitude: null,
                            longitude: null
                        }));
                    });
                }
            }],
            server: {
                port: 9696,
                strictPort: true
            }
        });

        await server.listen();

        server.printUrls();

        server.bindCLIShortcuts({
            print: true
        });
    }
}
