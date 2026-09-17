import test from "node:test";
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";

import { XiboWidgetRenderer, XiboXmlParser } from "../dist/developer/xml-module-parser.js";

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(repository, "dist", "cli.js");
const host = resolve(repository, "src", "developer", "xibo-player", "widget-html-render.twig");

async function command(args, cwd) {
    await exec(process.execPath, [cli, ...args], {
        cwd,
        timeout: 90_000,
        maxBuffer: 4 * 1024 * 1024
    });
}

test("#17: xibo build output composes module and static template without author sources", {
    timeout: 120_000
}, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "xibo-composition-"));
    const project = resolve(temporary, "project");
    const distRoot = resolve(project, ".xibo", "dist");
    const parser = new XiboXmlParser();
    const renderer = new XiboWidgetRenderer();
    let child;

    try {
        await command(["new", "stencil", "composition-module", project], repository);
        await command(["add", "static", "FeatureTemplate"], project);

        await mkdir(resolve(project, "node_modules"));
        await symlink(repository, resolve(project, "node_modules", "xibo-modules"), "junction");

        await writeFile(resolve(project, "index.html"),
            '<section data-from="module">MODULE_FROM_BUILD</section>');
        await writeFile(resolve(project, "template.html"),
            '<article data-from="template">TEMPLATE_FROM_BUILD</article>');
        await writeFile(resolve(project, ".bootstrap", "module.ts"), `
import { XiboModule, html } from "xibo-modules";
export default class CompositionModule extends XiboModule {
    stencil = html(
        "../index.html",
        () => '<meta name="module-head" content="compiled">',
        () => '.composition-module { display: block; }'
    );
    onRender() { document.body.dataset.moduleHook = "compiled"; }
}
`);
        await writeFile(resolve(project, ".bootstrap", "FeatureTemplate.ts"), `
import { XiboStaticTemplate, twig } from "xibo-modules";
export default class FeatureTemplate extends XiboStaticTemplate {
    stencil = twig(
        "../template.html",
        () => '<meta name="template-head" content="compiled">',
        () => '.composition-template { display: block; }'
    );
    onTemplateRender() { document.body.dataset.templateHook = "compiled"; }
}
`);

        await command(["build"], project);

        const manifest = JSON.parse(await readFile(resolve(project, ".xibo", "manifest.json"), "utf8"));
        assert.equal(typeof manifest.module, "string");
        assert.equal(typeof manifest["template:feature_template"], "string");
        assert.equal(typeof manifest.datatype, "string");

        const moduleXml = await parser.loadModule(manifest.module);
        const templateXml = await parser.loadTemplate(manifest["template:feature_template"], "feature_template");
        const datatype = await readFile(manifest.datatype, "utf8");
        assert.match(datatype, /<datatype>/);
        assert.equal(templateXml.dataType, moduleXml.dataType);
        assert.equal(templateXml.id, "feature_template");

        const render = () => renderer.render(
            manifest["template:feature_template"], distRoot, host,
            { templateId: "feature_template" }
        );
        const html = await render();
        for (const marker of [
            "MODULE_FROM_BUILD", "TEMPLATE_FROM_BUILD",
            'name="module-head"', 'name="template-head"',
            ".composition-module { display: block; }",
            ".composition-template { display: block; }",
            "function onRender_123", "function onTemplateRender_feature_template"
        ]) {
            assert.ok(html.includes(marker), `Missing compiled module/template output: ${marker}`);
        }
        assert.match(html, /"templateId":"feature_template"/);

        // Rebuild is deliberately NOT invoked: the renderer and xibo run must only use compiled XML.
        await writeFile(resolve(project, "index.html"), "CHANGED_AUTHOR_MODULE");
        await writeFile(resolve(project, "template.html"), "CHANGED_AUTHOR_TEMPLATE");
        await writeFile(resolve(project, ".bootstrap", "module.ts"), "BROKEN_AUTHOR_SOURCE");
        await writeFile(resolve(project, ".bootstrap", "FeatureTemplate.ts"), "BROKEN_AUTHOR_SOURCE");
        assert.equal(await render(), html);

        // Exercise the public xibo run path once, without replacing Xibo's player with a test dispatcher.
        let output = "";
        child = spawn(process.execPath, [cli, "run", "feature_template"], {
            cwd: project,
            stdio: ["ignore", "pipe", "pipe"]
        });
        child.stdout.on("data", chunk => { output += chunk; });
        child.stderr.on("data", chunk => { output += chunk; });

        let served;
        for (let attempt = 0; attempt < 100; attempt++) {
            if (child.exitCode !== null) break;
            try {
                // Vite's default localhost binding may be IPv6-only on CI.
                const response = await fetch("http://localhost:9696/", {
                    signal: AbortSignal.timeout(500)
                });
                if (response.ok) {
                    served = await response.text();
                    break;
                }
            }
            catch { /* Wait for the development server to become available. */ }
            await delay(100);
        }
        assert.ok(served, `xibo run did not serve HTML. Output:\n${output}`);
        assert.match(served, /MODULE_FROM_BUILD/);
        assert.match(served, /TEMPLATE_FROM_BUILD/);
        assert.doesNotMatch(served, /CHANGED_AUTHOR_MODULE|CHANGED_AUTHOR_TEMPLATE/);

        // Missing and ambiguous datatype matches must fail rather than silently selecting a module.
        const modulesRoot = resolve(distRoot, "modules");
        const duplicatePath = resolve(modulesRoot, "duplicate.xml");
        await copyFile(manifest.module, duplicatePath);
        await assert.rejects(render(), /Multiple modules found for datatype/);
        await rm(duplicatePath);
        await rm(manifest.module);
        await assert.rejects(render(), /No module found for datatype/);
        await rm(manifest["template:feature_template"]);
        await assert.rejects(render(), /ENOENT/);
    }
    finally {
        if (child && child.exitCode === null && child.signalCode === null) {
            const exited = once(child, "exit");
            child.kill();
            await exited;
        }
        await rm(temporary, { recursive: true, force: true });
    }
});
