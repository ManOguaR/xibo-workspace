import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { XiboModule, HtmlSource, html, twig, hbs } from "../dist/index.js";
import { XiboModuleDefinitionBuilder } from "../dist/build/builders/definition-builder.js";
import { XiboModuleXmlGenerator } from "../dist/build/generators/module-generator.js";

test("file sources resolve during definition composition, not XML generation", () => {
    const previous = process.cwd();
    const root = mkdtempSync(join(tmpdir(), "xibo-stencil-"));

    try {
        process.chdir(root);
        mkdirSync(".bootstrap");
        writeFileSync("index.html", "<h1>Original</h1>");

        class ExampleModule extends XiboModule {
            stencil = html("../index.html", { width: 320 });
            preview = twig`<p>Preview</p>`;
        }

        const definition = new XiboModuleDefinitionBuilder()
            .addModule(new ExampleModule(), { id: "example", name: "Example" })
            .build();

        assert.equal(definition.stencil.content, "<h1>Original</h1>");
        assert.equal(definition.stencil.width, 320);
        assert.equal(definition.preview.content, "<p>Preview</p>");
        assert.equal("path" in definition.stencil, false);

        // Proves the XML generator uses the frozen definition, not the original file.
        rmSync("index.html");
        const xml = new XiboModuleXmlGenerator().generate(definition);
        assert.match(xml, /<twig><!\[CDATA\[\s*<h1>Original<\/h1>/);
    }
    finally {
        process.chdir(previous);
        rmSync(root, { recursive: true, force: true });
    }
});

test("inline Twig and HTML preserve source and Twig placeholders", () => {
    const value = "Hello";
    const source = twig`<div data-hub="{{ settings.hubUrl }}">${value}</div>`;
    assert.equal(source.resolve().content,
        '<div data-hub="{{ settings.hubUrl }}">Hello</div>');
    assert.equal(html`<h1>Inline</h1>`.resolve().content, "<h1>Inline</h1>");
});

test("HBS metadata and programmatic sources survive resolution", () => {
    let calls = 0;
    const programmatic = new HtmlSource(() => {
        calls++;
        return "<p>Computed</p>";
    }, { height: 120 });

    assert.equal(programmatic.resolve().content, "<p>Computed</p>");
    assert.equal(programmatic.resolve().height, 120);
    assert.equal(calls, 2);
    assert.equal(hbs("missing.hbs", { id: "row" }).id, "row");
    assert.equal(hbs`<p>{{title}}</p>`.resolve().kind, "hbs");
});
