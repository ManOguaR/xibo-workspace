import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";

import { XiboModule, XiboStaticTemplate, HtmlSource, html, twig, hbs } from "../dist/index.js";
import { XiboModuleDefinitionBuilder } from "../dist/build/builders/definition-builder.js";
import { XiboModuleXmlGenerator } from "../dist/build/generators/module-generator.js";
import { XiboModuleTemplateXmlGenerator } from "../dist/build/generators/template-generator.js";

const parser = new XMLParser({
    trimValues: false,
    parseTagValue: false
});

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

test("static-template stencil remains independent from the module stencil through XML generation", () => {
    const moduleContent = '<section data-owner="module">Module stencil</section>';
    const templateContent = '<article data-owner="template">{{ player }}</article>';

    class ExampleModule extends XiboModule {
        stencil = twig`${moduleContent}`;
    }

    class ExampleTemplate extends XiboStaticTemplate {
        stencil = twig`${templateContent}`;
    }

    const definition = new XiboModuleDefinitionBuilder()
        .addModule(new ExampleModule(), {
            id: "stencil-module",
            name: "Stencil Module"
        })
        .addTemplate(new ExampleTemplate(), {
            id: "stencil-template",
            name: "Stencil Template"
        })
        .build();

    const templateDefinition = definition.templateDefinitions[0];

    assert.equal(definition.stencil.content, moduleContent);
    assert.equal(templateDefinition.stencil.content, templateContent);
    assert.notEqual(templateDefinition.stencil.content, definition.stencil.content);

    const moduleXml = new XiboModuleXmlGenerator().generate(definition);
    const templateXml = new XiboModuleTemplateXmlGenerator().generateTemplate(
        templateDefinition,
        definition.datatypeDefinition.id
    );

    const module = parser.parse(moduleXml).module;
    const template = parser.parse(templateXml).templates.template;

    assert.equal(module.stencil.twig.trim(), moduleContent);
    assert.equal(template.stencil.twig.trim(), templateContent);
    assert.equal(template.stencil.twig.includes(moduleContent), false);
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
    }, undefined, undefined, { height: 120 });

    assert.equal(programmatic.resolve().content, "<p>Computed</p>");
    assert.equal(programmatic.resolve().height, 120);
    assert.equal(calls, 2);
    assert.equal(hbs("missing.hbs", { id: "row" }).id, "row");
    assert.equal(hbs`<p>{{title}}</p>`.resolve().kind, "hbs");
});
