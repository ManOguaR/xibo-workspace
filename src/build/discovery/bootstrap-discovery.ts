import "tsx/esm";

import {
    readdir,
    readFile
} from "node:fs/promises";

import {
    extname,
    resolve
} from "node:path";

import { pathToFileURL } from "node:url";

import {
    XiboModule,
    XiboModuleTemplate
} from "xibo-modules";

import {
    JsonObject,
    MetadataMerger
} from "./metadata-merger.js";

export interface BootstrapDiscoveryResult {
    module?: XiboModule;
    templates: XiboModuleTemplate[];
    metadata: JsonObject;
    datatype?: unknown;
}

interface PackageJson {
    xibo?: JsonObject;
}

type Constructor = new () => unknown;

export class BootstrapDiscovery {
    constructor(
        private readonly bootstrapRoot: string
    ) {
    }

    async discover(): Promise<BootstrapDiscoveryResult> {
        const result: BootstrapDiscoveryResult = {
            templates: [],
            metadata: {}
        };

        await this.discoverDirectory(
            this.bootstrapRoot,
            result
        );

        const packageJson = await this.readPackageJson();

        const metadataMerger = new MetadataMerger();

        result.metadata = metadataMerger.merge(
            packageJson.xibo,
            result.metadata
        );

        return result;
    }

    private async discoverDirectory(
        directory: string,
        result: BootstrapDiscoveryResult
    ): Promise<void> {
        const entries = await readdir(directory, {
            withFileTypes: true
        });

        for (const entry of entries) {
            const path = resolve(
                directory,
                entry.name
            );

            if (entry.isDirectory()) {
                await this.discoverDirectory(
                    path,
                    result
                );

                continue;
            }

            if (!entry.isFile()) {
                continue;
            }

            switch (entry.name) {
                case "metadata.json":
                    result.metadata = await this.readJsonObject(path);
                    continue;

                case "datatype.json":
                    result.datatype = await this.readJson(path);
                    continue;
            }

            if (extname(entry.name) !== ".ts") {
                continue;
            }

            await this.discoverBootstrapType(
                path,
                result
            );
        }
    }

    private async discoverBootstrapType(
        path: string,
        result: BootstrapDiscoveryResult
    ): Promise<void> {
        const loaded = await import(
            pathToFileURL(path).href
        );

        for (const exported of Object.values(loaded)) {
            if (typeof exported !== "function") {
                continue;
            }

            let instance: unknown;

            try {
                instance = new (exported as Constructor)();
            }
            catch {
                continue;
            }

            if (instance instanceof XiboModule) {
                result.module = instance;
                continue;
            }

            if (instance instanceof XiboModuleTemplate) {
                result.templates.push(instance);
            }
        }
    }

    private async readPackageJson(): Promise<PackageJson> {
        const path = resolve(
            this.bootstrapRoot,
            "..",
            "package.json"
        );

        return await this.readJson(path) as PackageJson;
    }

    private async readJsonObject(
        path: string
    ): Promise<JsonObject> {
        return await this.readJson(path) as JsonObject;
    }

    private async readJson(
        path: string
    ): Promise<unknown> {
        return JSON.parse(
            await readFile(path, "utf8")
        );
    }
}