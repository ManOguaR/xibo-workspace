import test from "node:test";
import assert from "node:assert/strict";
import { XMLParser, XMLValidator } from "fast-xml-parser";

import { XiboModuleDefinition } from "../dist/build/builders/module-definition.js";
import { XiboModuleXmlGenerator } from "../dist/build/generators/module-generator.js";

const parser = new XMLParser({
    trimValues: false,
    parseTagValue: false
});

for (const [name, marker] of [
    ["ordinary source", "normal"],
    ["source containing the CDATA terminator", "]]> inside ]]> source"]
]) {
    test(`generated XML preserves ${name} after parsing`, () => {
        const stencilContent = `<div data-value="${marker}">{{ settings.value }}</div>`;
        const previewContent = `<p>{{title}} ${marker}</p>`;
        const head = `<script>const marker = ${JSON.stringify(marker)};</script>`;
        const style = `/* ${marker} */ .test { color: red; }`;
        const hooks = {
            onInitialize: `initialize(${JSON.stringify(marker)});`,
            onDataLoad: `load(${JSON.stringify(marker)});`,
            onParseData: `parse(${JSON.stringify(marker)});`,
            onRender: `render(${JSON.stringify(marker)});`,
            onVisible: `visible(${JSON.stringify(marker)});`
        };

        const definition = new XiboModuleDefinition(
            "cdata-test",
            "CDATA Test",
            "CdataTest"
        );

        definition.stencil = {
            kind: "twig",
            content: stencilContent,
            head,
            style
        };
        definition.preview = {
            kind: "hbs",
            id: "preview-row",
            content: previewContent
        };

        for (const [hook, content] of Object.entries(hooks)) {
            definition[hook] = () => content;
        }

        const xml = new XiboModuleXmlGenerator().generate(definition);

        assert.equal(XMLValidator.validate(xml), true);
        if (marker.includes("]]>") ) {
            assert.ok(xml.includes("]]]]><![CDATA[>"));
        }

        const module = parser.parse(xml).module;

        // The surrounding newlines and tabs are intentional XML formatting.
        assert.equal(module.stencil.twig, `\n${stencilContent}\n\t\t`);
        assert.equal(module.stencil.head, `\n${head}\n\t\t`);
        assert.equal(module.stencil.style, `\n${style}\n\t\t`);
        assert.equal(module.preview.hbs, `\n${previewContent}\n\t\t`);

        for (const [hook, content] of Object.entries(hooks)) {
            assert.equal(module[hook], `\n${content}\n\t`);
        }
    });
}
