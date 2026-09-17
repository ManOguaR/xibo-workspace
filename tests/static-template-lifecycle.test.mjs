import test from "node:test";
import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { XiboModule, XiboStaticTemplate } from "../dist/index.js";
import { XiboModuleDefinitionBuilder } from "../dist/build/builders/definition-builder.js";
import { XiboModuleXmlGenerator } from "../dist/build/generators/module-generator.js";
import { XiboModuleTemplateXmlGenerator } from "../dist/build/generators/template-generator.js";
import { XiboWidgetRenderer } from "../dist/developer/xml-module-parser.js";

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playerRoot = resolve(repository, "src", "developer", "xibo-player");

function findBrowser() {
    for (const binary of [
        process.env.CHROME_PATH,
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser"
    ].filter(Boolean)) {
        try {
            execFileSync(binary, ["--version"], { stdio: "ignore" });
            return binary;
        }
        catch { /* Try the next installed browser. */ }
    }
    return undefined;
}

const browser = findBrowser();

// Uses the actual Xibo 4.4.x browser bundle and Twig host, not a reimplemented dispatcher.
test("static template: selected hooks run in the real player in lifecycle order", {
    timeout: 120_000,
    skip: !browser && !process.env.CI ? "Chrome/Chromium not installed" : false
}, async () => {
    assert.ok(browser, "Chrome/Chromium is required for the CI browser regression");

    class LifecycleModule extends XiboModule {
        onInitialize(id) {
            document.body.dataset.trace = "1";
            document.body.dataset.widgetId = String(id);
        }

        onRender() {
            document.body.dataset.trace += "3";
        }
    }

    class FirstTemplate extends XiboStaticTemplate {
        onTemplateRender(id, target, items, properties) {
            if (id !== 123 || !Array.isArray(items) || !properties) {
                throw new Error("Invalid onTemplateRender context");
            }
            document.body.dataset.trace += "2";
        }

        onTemplateVisible(id, target, items, properties) {
            if (id !== 123 || !Array.isArray(items) || !properties) {
                throw new Error("Invalid onTemplateVisible context");
            }
            document.body.dataset.trace += "4";
        }
    }

    class SecondTemplate extends XiboStaticTemplate {
        onTemplateRender() {
            document.body.dataset.trace += "B";
        }
        // onTemplateVisible deliberately omitted.
    }

    // Xibo 4.4.x interpolates template IDs into JavaScript function names.
    const definition = new XiboModuleDefinitionBuilder()
        .addModule(new LifecycleModule(), { id: "lifecycle-module", name: "Lifecycle Module" })
        .addTemplate(new FirstTemplate(), { id: "first_template", name: "First" })
        .addTemplate(new SecondTemplate(), { id: "second_template", name: "Second" })
        .build();

    const temporary = await mkdtemp(resolve(tmpdir(), "xibo-template-lifecycle-"));
    const distRoot = resolve(temporary, "dist");
    const modulesRoot = resolve(distRoot, "modules");
    const templatePath = resolve(modulesRoot, "templates", "templates.xml");
    const host = resolve(playerRoot, "widget-html-render.twig");
    const renderer = new XiboWidgetRenderer();
    let page = "";

    const server = createServer(async (request, response) => {
        const path = new URL(request.url, "http://localhost").pathname;
        try {
            if (path === "/") {
                response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
                response.end(page);
            }
            else if (path === "/bundle.min.js" || path === "/fonts.css") {
                const content = await readFile(resolve(playerRoot, path.slice(1)));
                response.writeHead(200, {
                    "Content-Type": path.endsWith(".js") ? "text/javascript" : "text/css",
                    "Cache-Control": "no-store"
                });
                response.end(content);
            }
            else {
                response.writeHead(404);
                response.end();
            }
        }
        catch (error) {
            response.writeHead(500);
            response.end(String(error));
        }
    });

    try {
        await mkdir(resolve(modulesRoot, "templates"), { recursive: true });
        await writeFile(resolve(modulesRoot, "module.xml"),
            new XiboModuleXmlGenerator().generate(definition));
        await writeFile(templatePath,
            new XiboModuleTemplateXmlGenerator().generateTemplates(
                definition.templateDefinitions, definition.datatypeDefinition.id
            ));

        await new Promise((resolveListen, rejectListen) => {
            server.once("error", rejectListen);
            server.listen(0, "127.0.0.1", resolveListen);
        });
        const port = server.address().port;

        async function renderInBrowser(templateId) {
            page = await renderer.render(templatePath, distRoot, host, { templateId });
            assert.match(page, /"isDataExpected":true/);
            assert.match(page, /"url":null/);
            // Twing's json_encode serializes empty Twig maps as [] in this host.
            assert.match(page, /"data":\{"data":\[\],"meta":(?:\{\}|\[\])\}/);

            const profile = resolve(temporary, `chrome-${templateId}`);
            const { stdout } = await exec(browser, [
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-first-run",
                `--user-data-dir=${profile}`,
                "--virtual-time-budget=2500",
                "--dump-dom",
                `http://127.0.0.1:${port}/?template=${templateId}`
            ], { timeout: 30_000, maxBuffer: 16 * 1024 * 1024 });
            return stdout;
        }

        const first = await renderInBrowser("first_template");
        assert.match(first, /data-trace="1234"/, "initialize -> template render -> module fallback -> template visible");
        assert.match(first, /data-widget-id="123"/);
        assert.match(first, /function onTemplateRender_first_template/);
        assert.doesNotMatch(first, /onTemplateRender_second_template/);

        const second = await renderInBrowser("second_template");
        assert.match(second, /data-trace="1B3"/, "only selected template's render hook runs");
        assert.match(second, /function onTemplateRender_second_template/);
        assert.doesNotMatch(second, /onTemplateRender_first_template|onTemplateVisible_first_template/);
        assert.doesNotMatch(second, /function onTemplateVisible_second_template/);
    }
    finally {
        if (server.listening) {
            await new Promise((resolveClose, rejectClose) =>
                server.close(error => error ? rejectClose(error) : resolveClose()));
        }
        await rm(temporary, { recursive: true, force: true });
    }
});
