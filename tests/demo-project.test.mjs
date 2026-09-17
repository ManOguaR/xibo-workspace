import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { XiboXmlParser, XiboWidgetRenderer } from "../dist/developer/xml-module-parser.js";

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

function hookText(hook) {
    if (hook && typeof hook === "object") {
        return String(hook.__cdata ?? hook["#text"] ?? "");
    }
    return String(hook ?? "");
}

test("demo project: new → compiled XML/assets → static template HTML", {
    timeout: 120_000
}, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "xibo-demo-"));
    const project = resolve(temporary, "demo-test");

    try {
        await command(["new", "demo", "demo-test", project], repository);

        const pkg = JSON.parse(await readFile(resolve(project, "package.json"), "utf8"));
        assert.equal(pkg.xibo.id, "demo-test");
        assert.equal(pkg.xibo.bounce_template.name, "BounceTemplate");
        assert.equal(pkg.xibo.vite, "src/main.ts");
        assert.match(pkg.dependencies.gsap, /^\^3\./);
        assert.ok(pkg.devDependencies.vite);
        assert.ok(pkg.devDependencies["xibo-modules"]);

        const moduleSource = await readFile(resolve(project, ".bootstrap", "module.ts"), "utf8");
        const templateSource = await readFile(resolve(project, ".bootstrap", "BounceTemplate.ts"), "utf8");
        const appSource = await readFile(resolve(project, "src", "main.ts"), "utf8");
        assert.match(moduleSource, /class DemoTest extends XiboModule/);
        assert.match(moduleSource, /window\.BounceTest\.initialize/);
        assert.match(moduleSource, /window\.BounceTest\.render/);
        assert.match(templateSource, /window\.BounceTest\.templateRender/);
        assert.match(appSource, /import \{ gsap \} from "gsap"/);
        assert.match(appSource, /gsap\.ticker\.add\(animate\)/);
        await readFile(resolve(project, "src", "main.css"), "utf8");

        // CI fixture: compile without network/npm install. The generated package.json
        // declares the real GSAP dependency for users.
        await mkdir(resolve(project, "node_modules", "gsap"), { recursive: true });
        await symlink(repository, resolve(project, "node_modules", "xibo-modules"), "junction");
        await writeFile(resolve(project, "node_modules", "gsap", "package.json"),
            '{"name":"gsap","version":"3.14.0","type":"module","exports":"./index.js"}\n');
        await writeFile(resolve(project, "node_modules", "gsap", "index.js"),
            'export const gsap = { ticker: { add() {} }, set() {} };\n');

        await command(["build"], project);

        const manifest = JSON.parse(await readFile(
            resolve(project, ".xibo", "manifest.json"), "utf8"
        ));
        assert.equal(typeof manifest.module, "string");
        assert.equal(typeof manifest["template:bounce_template"], "string");
        const parser = new XiboXmlParser();
        const moduleXml = await parser.loadModule(manifest.module);
        const templateXml = await parser.loadTemplate(manifest["template:bounce_template"], "bounce_template");
        assert.match(hookText(moduleXml.onInitialize), /BounceTest\.initialize/);
        assert.match(hookText(moduleXml.onRender), /BounceTest\.render/);
        assert.match(hookText(templateXml.onTemplateRender), /BounceTest\.templateRender/);

        // Hooks are inserted as JavaScript bodies, not transpiled by Vite.
        for (const hook of [moduleXml.onInitialize, templateXml.onTemplateRender, moduleXml.onRender]) {
            new Function("id", "target", "items", "properties", "meta", hookText(hook));
        }

        const dist = resolve(project, ".xibo", "dist");
        const html = await new XiboWidgetRenderer().render(
            manifest["template:bounce_template"], dist, host, { templateId: "bounce_template" }
        );
        assert.match(html, /bounce-stage/);
        assert.match(html, /bounce-template-label/);
        assert.match(html, /onInitialize_123/);
        assert.match(html, /onTemplateRender_bounce_template/);
        assert.match(html, /onRender_123/);
        assert.doesNotMatch(html, /\[\[assetId=/);
        const assets = Array.isArray(moduleXml.assets.asset)
            ? moduleXml.assets.asset
            : [moduleXml.assets.asset];
        const js = assets.find(asset => asset.mimeType === "text/javascript");
        assert.ok(js);
        assert.ok(html.includes(js.path));
        assert.match(await readFile(resolve(dist, `.${js.path}`), "utf8"), /BounceTest/);
    }
    finally {
        await rm(temporary, { recursive: true, force: true });
    }
});
