import { readdir, readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: false
});

function entries(value: unknown): Record<string, unknown>[] {
    if (value === undefined || value === null) return [];
    return (Array.isArray(value) ? value : [value])
        .filter(item => item !== null && typeof item === "object") as Record<string, unknown>[];
}

function node(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

/** Validate Xibo-generated URLs against the exact dist tree that xibo run serves. */
export async function validateDistAssets(distRoot: string): Promise<void> {
    const modulesRoot = resolve(distRoot, "modules");
    for (const folder of [modulesRoot, resolve(modulesRoot, "templates")]) {
        let xmlFiles;
        try {
            xmlFiles = await readdir(folder, { withFileTypes: true });
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT" && folder !== modulesRoot) continue;
            throw error;
        }

        for (const xmlFile of xmlFiles) {
            if (!xmlFile.isFile() || !xmlFile.name.endsWith(".xml")) continue;
            const document = node(parser.parse(await readFile(resolve(folder, xmlFile.name), "utf8")));
            const templates = node(document.templates).template ?? document.template;
            const definitions = [node(document.module), ...entries(templates)];

            for (const definition of definitions) {
                for (const asset of entries(node(definition.assets).asset)) {
                    if (asset.cmsOnly === true || asset.cmsOnly === "true" || asset.cmsOnly === "1") continue;
                    const id = asset.id;
                    const path = asset.path;
                    if (typeof id !== "string" || !id) {
                        throw new Error(`Invalid Xibo asset id in ${xmlFile.name}: ${String(id)}`);
                    }
                    // Xibo's URLs are rooted at the run server, not the filesystem.
                    // Reject traversal, query strings, encoded or Windows separators.
                    const segments = typeof path === "string" ? path.split("/") : [];
                    if (typeof path !== "string" || !/^\/[A-Za-z0-9._/-]+$/.test(path)
                        || segments.some(segment => segment === "" && segments.indexOf(segment) !== 0
                            || segment === "." || segment === "..")) {
                        throw new Error(`Invalid Xibo asset path '${String(path)}' (id '${id}', XML '${xmlFile.name}').`);
                    }
                    const absolute = resolve(distRoot, `.${path}`);
                    const relativePath = relative(distRoot, absolute);
                    if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${requireSeparator()}`)
                        || isAbsolute(relativePath)) {
                        throw new Error(`Invalid Xibo asset path '${path}' (id '${id}', XML '${xmlFile.name}').`);
                    }
                    try {
                        if (!(await stat(absolute)).isFile()) {
                            throw new Error("not a file");
                        }
                    }
                    catch {
                        throw new Error(`Missing Xibo asset '${id}' at '${path}' (XML '${xmlFile.name}').`);
                    }
                }
            }
        }
    }
}

function requireSeparator(): string {
    return process.platform === "win32" ? "\\" : "/";
}
