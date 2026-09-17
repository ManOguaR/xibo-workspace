import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

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

test("#11: emitted JS/CSS assets resolve and broken references fail explicitly", {
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

        const renderer = new XiboWidgetRenderer();
        const html = await renderer.render(moduleXmlPath, distRoot, hostTwig);
        assert.match(html, /src="\/AssetCheck\/assets\/assetcheck\.min\.js"/);
        assert.match(html, /href="\/AssetCheck\/assets\/assetcheck\.min\.css"/);

        assert.throws(
            () => new XiboPlayerAdapter().decorate("[[assetId=missing-id]]", { assets: [] }),
            /Unresolved Xibo asset: missing-id/
        );

        await rm(jsPath);
        await assert.rejects(
            renderer.render(moduleXmlPath, distRoot, hostTwig),
            /Missing Xibo asset 'assetcheck-js': \/AssetCheck\/assets\/assetcheck\.min\.js/
        );

        await writeFile(jsPath, "globalThis.__ASSET_CHECK__ = true;\n");
        await writeFile(
            moduleXmlPath,
            moduleXml.replace(
                "/AssetCheck/assets/assetcheck.min.js",
                "/../escape.js"
            )
        );
        await assert.rejects(
            renderer.render(moduleXmlPath, distRoot, hostTwig),
            /Invalid Xibo asset path 'assetcheck-js': \/\.\.\/escape\.js/
        );
    }
    finally {
        await rm(temporary, { recursive: true, force: true });
    }
});
