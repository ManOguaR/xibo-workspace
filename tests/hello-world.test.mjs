import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { XiboWidgetRenderer } from "../dist/developer/xml-module-parser.js";

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(repository, "dist", "cli.js");
const host = resolve(repository, "src", "developer", "xibo-player", "widget-html-render.twig");

test("hello-world: new -> build -> render compiled XML", { timeout: 120_000 }, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "xibo-hello-world-"));
    const project = resolve(temporary, "hello-world");

    try {
        await exec(process.execPath, [cli, "new", "hello-world", "hello-world", project], {
            cwd: repository,
            timeout: 30_000
        });

        // The generated project imports xibo-modules, but this fixture needs no npm install.
        await mkdir(resolve(project, "node_modules"));
        await symlink(repository, resolve(project, "node_modules", "xibo-modules"), "junction");

        await exec(process.execPath, [cli, "build"], {
            cwd: project,
            timeout: 90_000,
            maxBuffer: 4 * 1024 * 1024
        });

        const manifest = JSON.parse(await readFile(resolve(project, ".xibo", "manifest.json"), "utf8"));
        assert.equal(typeof manifest.module, "string");

        const xml = await readFile(manifest.module, "utf8");
        assert.match(xml, /<h1>Hello World<\/h1>/);

        const renderer = new XiboWidgetRenderer();
        const render = () => renderer.render(
            manifest.module,
            resolve(project, ".xibo", "dist"),
            host
        );

        // Changes in the author source must not affect render without a new build.
        await writeFile(resolve(project, "index.html"), "<h1>AUTHOR SOURCE CHANGED</h1>");
        const original = await render();
        assert.match(original, /<h1>Hello World<\/h1>/);
        assert.doesNotMatch(original, /AUTHOR SOURCE CHANGED/);

        // Changes in the compiled XML must affect render: it is the runtime source.
        const modified = xml.replace("<h1>Hello World</h1>", "<h1>COMPILED XML ONLY</h1>");
        assert.notEqual(modified, xml);
        await writeFile(manifest.module, modified);

        const compiled = await render();
        assert.match(compiled, /<h1>COMPILED XML ONLY<\/h1>/);
        assert.doesNotMatch(compiled, /Hello World|AUTHOR SOURCE CHANGED/);
    }
    finally {
        await rm(temporary, { recursive: true, force: true });
    }
});
