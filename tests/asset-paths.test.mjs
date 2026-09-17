import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { XMLParser } from "fast-xml-parser";

import { XiboPlayerAdapter, XiboWidgetRenderer } from "../dist/developer/xml-module-parser.js";

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(repository, "dist", "cli.js");
const hostTwig = resolve(repository, "src", "developer", "xibo-player", "widget-html-render.twig");

async function command(args, cwd) {
    await exec(process.execPath, [cli, ...args], {
        cwd,
        timeout: 90_000,
        maxBuffer: 4 * 1024 * 1024
    });
}

// Audit generated artifacts in the test, without adding filesystem checks to the renderer.
async function assetProblems(xml, distRoot) {
    const document = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: ""
    }).parse(xml);
    const entries = document.module?.assets?.asset;
    const assets = entries === undefined ? [] : Array.isArray(entries) ? entries : [entries];
    const root = resolve(distRoot);
    const problems = [];

    for (const asset of assets) {
        const { id, path, mimeType } = asset;
        if (mimeType !== "text/css" && mimeType !== "text/javascript") continue;

        if (typeof path !== "string" || !path.startsWith("/") || path.includes("\\")) {
            problems.push({ id, path, reason: "invalid path" });
            continue;
        }

        const localPath = resolve(root, path.slice(1));
        const fromRoot = relative(root, localPath);
        if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
            problems.push({ id, path, reason: "invalid path" });
            continue;
        }

        try {
            await access(localPath);
        }
        catch (error) {
            if (error.code !== "ENOENT") throw error;
            problems.push({ id, path, reason: "missing file" });
        }
    }

    return problems;
}

test("#11: emitted JS/CSS assets resolve and tests detect broken references", {
    timeout: 120_000
}, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "xibo-asset-paths-"));
    const project = resolve(temporary, "project");

    try {
        await command(["new", "asset-check", project], repository);
        await mkdir(resolve(project, "node_modules"));
        await symlink(repository, resolve(project, "node_modules", "xibo-modules"), "junction");

        await writeFile(
            resolve(project, "src", "style.css"),
            "body { background: rgb(1, 2, 3); }\n"
        );
        await writeFile(
            resolve(project, "src", "main.ts"),
            'import "./style.css";\nglobalThis.__ASSET_CHECK__ = true;\n'
        );

        await command(["build"], project);

        const manifest = JSON.parse(await readFile(resolve(project, ".xibo", "manifest.json"), "utf8"));
        const moduleXmlPath = manifest.module;
        const distRoot = resolve(project, ".xibo", "dist");
        const jsPath = resolve(distRoot, "AssetCheck", "assets", "assetcheck.min.js");
        const cssPath = resolve(distRoot, "AssetCheck", "assets", "assetcheck.min.css");

        await access(jsPath);
        await access(cssPath);

        const moduleXml = await readFile(moduleXmlPath, "utf8");
        assert.match(moduleXml, /<asset id="assetcheck-js"[^>]*mimeType="text\/javascript"[^>]*path="\/AssetCheck\/assets\/assetcheck\.min\.js"/);
        assert.match(moduleXml, /<asset id="assetcheck-css"[^>]*mimeType="text\/css"[^>]*path="\/AssetCheck\/assets\/assetcheck\.min\.css"/);
        assert.deepEqual(await assetProblems(moduleXml, distRoot), []);

        const renderer = new XiboWidgetRenderer();
        const html = await renderer.render(moduleXmlPath, distRoot, hostTwig);
        assert.match(html, /src="\/AssetCheck\/assets\/assetcheck\.min\.js"/);
        assert.match(html, /href="\/AssetCheck\/assets\/assetcheck\.min\.css"/);

        // An unresolvable placeholder is still a genuine player-adapter error.
        assert.throws(
            () => new XiboPlayerAdapter().decorate("[[assetId=missing-id]]", { assets: [] }),
            /Unresolved Xibo asset: missing-id/
        );

        await rm(jsPath);
        assert.deepEqual(await assetProblems(await readFile(moduleXmlPath, "utf8"), distRoot), [
            { id: "assetcheck-js", path: "/AssetCheck/assets/assetcheck.min.js", reason: "missing file" }
        ]);

        await writeFile(jsPath, "globalThis.__ASSET_CHECK__ = true;\n");
        await writeFile(
            moduleXmlPath,
            moduleXml.replace(
                "/AssetCheck/assets/assetcheck.min.js",
                "/../escape.js"
            )
        );
        assert.deepEqual(await assetProblems(await readFile(moduleXmlPath, "utf8"), distRoot), [
            { id: "assetcheck-js", path: "/../escape.js", reason: "invalid path" }
        ]);
    }
    finally {
        await rm(temporary, { recursive: true, force: true });
    }
});
