import test from "node:test";
import assert from "node:assert/strict";
import { XMLParser, XMLValidator } from "fast-xml-parser";

import { XiboModuleDefinition } from "../dist/build/builders/module-definition.js";
import { XiboModuleXmlGenerator } from "../dist/build/generators/module-generator.js";
import { XiboPlayerHook } from "../dist/build/private-types.js";

const parser = new XMLParser({
    trimValues: false,
    parseTagValue: false
});

const hookMethods = {
    ordinary() {
        initialize("normal");
    },
    terminator() {
        initialize("]]> inside ]]> source");
    }
};

const hookNames = [
    "onInitialize",
    "onDataLoad",
    "onParseData",
    "onRender",
    "onVisible"
];

for (const [name, marker, method] of [
    ["ordinary source", "normal", hookMethods.ordinary],
    ["source containing the CDATA terminator", "]]> inside ]]> source", hookMethods.terminator]
]) {
    test(`generated XML preserves ${name} after parsing`, () => {
        const stencilContent = `<div data-value="${marker}">{{ settings.value }}</div>`;
        const previewContent = `<p>{{title}} ${marker}</p>`;
        const head = `<script>const marker = ${JSON.stringify(marker)};</script>`;
        const style = `/* ${marker} */ .test { color: red; }`;
        const hookContent = `initialize(${JSON.stringify(marker)});`;
        const hook = new XiboPlayerHook(method);

        assert.equal(hook.content, hookContent);

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

        for (const name of hookNames) {
            definition[name] = hook;
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

        for (const name of hookNames) {
            assert.equal(module[name], `\n${hookContent}\n\t`);
        }
    });
}
