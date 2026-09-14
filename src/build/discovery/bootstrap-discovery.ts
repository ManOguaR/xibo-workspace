import "tsx/esm";
import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { XiboModule, XiboModuleTemplate } from "xibo-modules";
import { BootstrapValidator } from "../validation/bootstrap-validator.js"
import { BootstrapDiscoveryResult, ValidationSeverity } from "../private-types.js";

import { JsonObject, MetadataMerger } from "./metadata-merger.js";

interface PackageJson {
    xibo?: JsonObject;
}

type Constructor = new () => unknown;

export class BootstrapDiscovery {

    private readonly validator: BootstrapValidator;
    private readonly merger: MetadataMerger;

    constructor(
        private readonly bootstrapRoot: string
    ) {
        this.validator = new BootstrapValidator();
        this.merger = new MetadataMerger();
    }

    async discover(): Promise<BootstrapDiscoveryResult> {
        const result: BootstrapDiscoveryResult = new BootstrapDiscoveryResult();

        const packageJson = await this.readPackageJson();

        result.metadata = this.merger.merge(
            packageJson.xibo
        );

        await this.discoverDirectory(
            this.bootstrapRoot,
            result
        );
        
        if (result.module === undefined) {
            result.issues.push({
                severity: ValidationSeverity.Critical,
                code: "bootstrap.module.missing",
                message: "No XiboModule definition was discovered."
            });
            
            throw new Error(
                "No XiboModule definition was discovered."
            );
        }
        
        result.issues.push(
            ...this.validator.validateIdentity(
                result.metadata,
                result.module
            )
        );
        
        result.issues.push(
            ...this.validator.validateModuleTemplates(
                result.metadata,
                result.templates
            )
        );        

        return result;
    }

    private async discoverDirectory(
        directory: string,
        result: BootstrapDiscoveryResult
    ): Promise<void> {
        let entries;

        try {
            entries = await readdir(directory, {
                withFileTypes: true
            });
        }
        catch {
            result.issues.push({
                severity: ValidationSeverity.Critical,
                code: "bootstrap.directory.unavailable",
                path: directory,
                message: `Bootstrap directory '${directory}' cannot be read.`
            });

            throw new Error(
                `Bootstrap directory '${directory}' cannot be read.`
            );
        }

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

            if (extname(entry.name) === ".json") {
                const metadata = await this.readJsonObject(path);

                this.discoverJsonMetadata(
                    entry.name,
                    metadata,
                    result
                );

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

    private discoverJsonMetadata(
        filename: string,
        metadata: JsonObject,
        result: BootstrapDiscoveryResult
    ): void {
        const name = filename.slice(
            0,
            -extname(filename).length
        );

        let discovered: JsonObject;

        if (filename === "metadata.json") {
            discovered = metadata;
        }
        else if (filename === "datatype.json") {
            discovered = {
                datatype: metadata
            };
        }
        else if (
            Object.keys(metadata).length === 1 &&
            metadata["datatype"] !== undefined
        ) {
            discovered = metadata;
        }
        else {
            const id = metadata["id"];

            if (
                typeof id === "string" &&
                id === name
            ) {
                discovered = metadata;
            }
            else if (typeof id === "string") {
                const {
                    id: _,
                    ...content
                } = metadata;

                discovered = {
                    [id]: content
                };
            }
            else {
                discovered = {
                    [name]: metadata
                };
            }
        }

        result.issues.push(
            ...this.validator.validateMetadataOverride(
                result.metadata,
                discovered,
                filename
            )
        );

        result.metadata = this.merger.merge(
            result.metadata,
            discovered
        );
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
                 if (result.module !== undefined) {
                    result.issues.push({
                        severity: ValidationSeverity.Critical,
                        code: "bootstrap.module.multiple",
                        message: "More than one XiboModule definition was discovered."
                    });
                    
                    throw new Error(
                        "More than one XiboModule definition was discovered."
                    );
                }

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
