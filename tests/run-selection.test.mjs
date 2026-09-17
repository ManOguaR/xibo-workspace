import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { XMLParser } from "fast-xml-parser";

import { runRunCommand } from "../dist/commands/run.js";
import { DevServer } from "../dist/developer/dev-server.js";

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(repository, "dist", "cli.js");

async function command(args, cwd) {
    await exec(process.execPath, [cli, ...args], {
        cwd,
        timeout: 90_000,
        maxBuffer: 4 * 1024 * 1024
    });
}

// Inspect generated XML directly; xibo run is responsible for selection, not document-wide auditing.
function templateIds(xml) {
    const entries = new XMLParser({ parseTagValue: false }).parse(xml).templates?.template;
    return (Array.isArray(entries) ? entries : entries === undefined ? [] : [entries])
        .map(template => template.id);
}

test("#18: xibo run selects module, individual and combined templates and rejects invalid IDs", {
    timeout: 120_000
}, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "xibo-run-selection-"));
    const project = resolve(temporary, "project");
    const isolatedTmp = resolve(temporary, "runtime-tmp");
    const outputHtml = resolve(isolatedTmp, "xibo-workspace", "run", "index.html");
    const manifestPath = resolve(project, ".xibo", "manifest.json");
    const packagePath = resolve(project, "package.json");
    const previousCwd = process.cwd();
    const previousTemp = {
        TMPDIR: process.env.TMPDIR,
        TMP: process.env.TMP,
        TEMP: process.env.TEMP
    };
    const previousStart = DevServer.prototype.start;

    try {
        await command(["new", "stencil", "selection-module", project], repository);
        await command(["add", "static", "FirstCard"], project);
        await command(["add", "static", "SecondCard"], project);
        await mkdir(resolve(project, "node_modules"));
        await symlink(repository, resolve(project, "node_modules", "xibo-modules"), "junction");
        await writeFile(resolve(project, "index.html"), '<div>MODULE_SELECTION_ONLY</div>');
        await writeFile(resolve(project, ".bootstrap", "FirstCard.ts"), [
            'import { XiboStaticTemplate, html } from "xibo-modules";',
            'export default class FirstCard extends XiboStaticTemplate {',
            '    stencil = html`<div>FIRST_SELECTION_ONLY</div>`;',
            '    onTemplateRender() { document.body.dataset.selected = "first"; }',
            '}'
        ].join("\n"));
        await writeFile(resolve(project, ".bootstrap", "SecondCard.ts"), [
            'import { XiboStaticTemplate, html } from "xibo-modules";',
            'export default class SecondCard extends XiboStaticTemplate {',
            '    stencil = html`<div>SECOND_SELECTION_ONLY</div>`;',
            '    onTemplateRender() { document.body.dataset.selected = "second"; }',
            '}'
        ].join("\n"));
        await command(["build"], project);

        let manifest = JSON.parse(await readFile(manifestPath, "utf8"));
        assert.ok(manifest.module);
        assert.equal(basename(manifest["template:first_card"]), "first-card-static.xml");
        assert.equal(basename(manifest["template:second_card"]), "second-card-static.xml");
        assert.notEqual(manifest["template:first_card"], manifest["template:second_card"]);

        await mkdir(isolatedTmp);
        // os.tmpdir() uses TMPDIR/TMP/TEMP on POSIX and TEMP/TMP on Windows.
        // Set all three so this test never shares xibo-workspace/run with another test.
        process.env.TMPDIR = isolatedTmp;
        process.env.TMP = isolatedTmp;
        process.env.TEMP = isolatedTmp;
        process.chdir(project);
        // Selection and rendering are real; only the HTTP listener is disabled to avoid
        // colliding with the separate #17 end-to-end test on Vite's fixed port 9696.
        DevServer.prototype.start = async function () {};

        async function rendered(args) {
            await runRunCommand(args);
            return readFile(outputHtml, "utf8");
        }

        function assertSelected(html, selected) {
            assert.match(html, /MODULE_SELECTION_ONLY/);
            for (const [id, marker] of [
                ["first", "FIRST_SELECTION_ONLY"],
                ["second", "SECOND_SELECTION_ONLY"]
            ]) {
                if (selected === id) assert.match(html, new RegExp(marker));
                else assert.doesNotMatch(html, new RegExp(marker));
            }
            assert.match(html, new RegExp(`"templateId":"${selected === "module" ? "selection-module" : `${selected}_card`}"`));
        }

        assertSelected(await rendered([]), "module");
        assertSelected(await rendered(["selection-module"]), "module");
        assertSelected(await rendered(["first_card"]), "first");
        assertSelected(await rendered(["second_card"]), "second");
        await assert.rejects(runRunCommand(["unknown_card"]), /Unknown Xibo module\/template: unknown_card/);
        await assert.rejects(runRunCommand(["first_card", "second_card"]), /Usage: xibo run \[id\]/);

        const originalFirst = manifest["template:first_card"];
        manifest["template:first_card"] = manifest["template:second_card"];
        await writeFile(manifestPath, JSON.stringify(manifest));
        await assert.rejects(runRunCommand(["first_card"]), /Xibo template not found: first_card/);
        manifest["template:first_card"] = resolve(project, "missing-template.xml");
        await writeFile(manifestPath, JSON.stringify(manifest));
        await assert.rejects(runRunCommand(["first_card"]), /ENOENT/);
        manifest["template:first_card"] = originalFirst;
        await writeFile(manifestPath, JSON.stringify(manifest));

        const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
        packageJson.build = { singleFileTemplates: true };
        await writeFile(packagePath, JSON.stringify(packageJson));
        await command(["build"], project);
        manifest = JSON.parse(await readFile(manifestPath, "utf8"));
        assert.ok(manifest.templates, "combined build must emit a templates manifest entry");
        assert.equal(Object.hasOwn(manifest, "template:first_card"), false);
        assert.equal(Object.hasOwn(manifest, "template:second_card"), false);
        const combined = await readFile(manifest.templates, "utf8");
        assert.match(combined, /<id>first_card<\/id>/);
        assert.match(combined, /<id>second_card<\/id>/);
        const generatedIds = templateIds(combined);
        assert.deepEqual(generatedIds, ["first_card", "second_card"]);
        assert.equal(new Set(generatedIds).size, generatedIds.length, "generated template IDs must be unique");

        assertSelected(await rendered([]), "module");
        assertSelected(await rendered(["first_card"]), "first");
        assertSelected(await rendered(["second_card"]), "second");
        await assert.rejects(runRunCommand(["unknown_card"]), /Xibo template not found: unknown_card/);

        // A combined manifest pointing at another, valid template is not a fallback.
        const correctCombinedPath = manifest.templates;
        manifest.templates = originalFirst;
        await writeFile(manifestPath, JSON.stringify(manifest));
        await assert.rejects(runRunCommand(["second_card"]), /Xibo template not found: second_card/);
        manifest.templates = correctCombinedPath;
        await writeFile(manifestPath, JSON.stringify(manifest));

        // Audit invalid fixtures here, not by forcing xibo run to validate every template.
        const firstNode = combined.match(/<template>[\s\S]*?<\/template>/)?.[0];
        assert.ok(firstNode);
        const duplicateIds = templateIds(combined.replace("</templates>", `${firstNode}</templates>`));
        assert.deepEqual(duplicateIds, ["first_card", "second_card", "first_card"]);
        assert.notEqual(new Set(duplicateIds).size, duplicateIds.length, "duplicate fixture must contain repeated IDs");

        const missingIds = templateIds(combined.replace("<id>first_card</id>", ""));
        assert.deepEqual(missingIds, [undefined, "second_card"]);
    }
    finally {
        DevServer.prototype.start = previousStart;
        process.chdir(previousCwd);
        for (const [name, value] of Object.entries(previousTemp)) {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        }
        await rm(temporary, { recursive: true, force: true });
    }
});
