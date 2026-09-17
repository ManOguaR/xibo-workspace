import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createServer } from "vite";

import { validateDistAssets } from "../dist/developer/asset-validator.js";
import { XiboPlayerAdapter, XiboWidgetRenderer, XiboXmlParser } from "../dist/developer/xml-module-parser.js";

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(repository, "dist", "cli.js");
const host = resolve(repository, "src", "developer", "xibo-player", "widget-html-render.twig");
const runUrl = new URL("../dist/commands/run.js", import.meta.url).href;
const devServerUrl = new URL("../dist/developer/dev-server.js", import.meta.url).href;

async function command(args, cwd) {
    await exec(process.execPath, [cli, ...args], {
        cwd,
        timeout: 90_000,
        maxBuffer: 4 * 1024 * 1024
    });
}

test("#11: compiled JS/CSS resolve to served files; missing IDs, files and invalid paths fail", {
    timeout: 120_000
}, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "xibo-assets-"));
    const project = resolve(temporary, "project");
    const distRoot = resolve(project, ".xibo", "dist");
    const isolatedTmp = resolve(temporary, "runtime-tmp");
    let server;

    try {
        // The two-argument new command creates the module with a companion app.
        await command(["new", "asset-fixture", project], repository);
        await mkdir(resolve(project, "node_modules"));
        await symlink(repository, resolve(project, "node_modules", "xibo-modules"), "junction");
        await writeFile(resolve(project, "index.html"),
            '<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>');
        await writeFile(resolve(project, "src", "main.ts"),
            'import "./main.css"; document.body.dataset.xml11 = "XML11_JS_LOADED";\n');
        await writeFile(resolve(project, "src", "main.css"),
            'body { --xml11-asset: XML11_CSS_LOADED; }\n');
        await command(["build"], project);

        const manifest = JSON.parse(await readFile(resolve(project, ".xibo", "manifest.json"), "utf8"));
        const parser = new XiboXmlParser();
        const moduleXml = await parser.loadModule(manifest.module);
        const assets = Array.isArray(moduleXml.assets.asset)
            ? moduleXml.assets.asset
            : [moduleXml.assets.asset];
        const js = assets.find(asset => asset.mimeType === "text/javascript");
        const css = assets.find(asset => asset.mimeType === "text/css");
        assert.ok(js, "build must declare the companion JS");
        assert.ok(css, "build must declare the companion CSS");
        assert.notEqual(js.id, css.id);

        const fileFor = asset => resolve(distRoot, `.${asset.path}`);
        assert.match(await readFile(fileFor(js), "utf8"), /XML11_JS_LOADED/);
        assert.match(await readFile(fileFor(css), "utf8"), /XML11_CSS_LOADED/);
        await validateDistAssets(distRoot);

        const renderer = new XiboWidgetRenderer();
        const html = await renderer.render(manifest.module, distRoot, host);
        assert.ok(html.includes(`src="${js.path}"`), "rendered JS URL must match built XML");
        assert.ok(html.includes(`href="${css.path}"`), "rendered CSS URL must match built XML");
        assert.doesNotMatch(html, /\[\[assetId=/);

        // Vite serves from the same dist layout copied by xibo run, on a test-only ephemeral port.
        server = await createServer({
            root: distRoot,
            configFile: false,
            server: { host: "127.0.0.1", port: 0 }
        });
        await server.listen();
        const address = server.httpServer.address();
        assert.ok(address && typeof address !== "string");
        for (const [asset, marker] of [[js, "XML11_JS_LOADED"], [css, "XML11_CSS_LOADED"]]) {
            const response = await fetch(`http://127.0.0.1:${address.port}${asset.path}`);
            assert.equal(response.status, 200, `${asset.id}: ${asset.path}`);
            assert.ok((await response.text()).includes(marker), `${asset.id}: served wrong file`);
        }
        await server.close();
        server = undefined;

        assert.throws(
            () => new XiboPlayerAdapter().decorate("[[assetId=unknown-xml11]]", { assets: [], width: 1920 }),
            /Unresolved Xibo asset: unknown-xml11/
        );

        // Exercise the public run pipeline without Vite's fixed port or a shared temp folder.
        await mkdir(isolatedTmp);
        const runScript = `
import { runRunCommand } from ${JSON.stringify(runUrl)};
import { DevServer } from ${JSON.stringify(devServerUrl)};
DevServer.prototype.start = async function () {};
await runRunCommand([]);
`;
        const runWithoutListener = () => exec(process.execPath,
            ["--input-type=module", "--eval", runScript], {
                cwd: project,
                env: { ...process.env, TMPDIR: isolatedTmp, TMP: isolatedTmp, TEMP: isolatedTmp },
                timeout: 90_000,
                maxBuffer: 4 * 1024 * 1024
            });
        await runWithoutListener();

        await rm(fileFor(js));
        await assert.rejects(validateDistAssets(distRoot), new RegExp(`Missing Xibo asset.*${js.id}`));
        await assert.rejects(runWithoutListener(), error => {
            assert.match(error.stderr, new RegExp(`Missing Xibo asset.*${js.id}`));
            return true;
        });

        // A malformed URL must not be repaired or resolved outside the current build.
        const xml = await readFile(manifest.module, "utf8");
        assert.ok(xml.includes(`path="${js.path}"`));
        await writeFile(manifest.module, xml.replace(`path="${js.path}"`, 'path="../escaped.js"'));
        await assert.rejects(validateDistAssets(distRoot), new RegExp(`Invalid Xibo asset path.*${js.id}`));
        await assert.rejects(runWithoutListener(), error => {
            assert.match(error.stderr, new RegExp(`Invalid Xibo asset path.*${js.id}`));
            return true;
        });
    }
    finally {
        if (server) await server.close();
        await rm(temporary, { recursive: true, force: true });
    }
});
