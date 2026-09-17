import test from "node:test";
import assert from "node:assert/strict";
import { XMLParser } from "fast-xml-parser";

import {
    XiboModuleDefinition,
    XiboModuleTemplateDefinition
} from "../dist/build/builders/module-definition.js";
import { XiboModuleXmlGenerator } from "../dist/build/generators/module-generator.js";
import { XiboModuleTemplateXmlGenerator } from "../dist/build/generators/template-generator.js";
import {
    XiboXmlParser,
    XiboRenderModelBuilder
} from "../dist/developer/xml-module-parser.js";

function fixtures() {
    const module = new XiboModuleDefinition("selection-module", "Selection", "SelectionModule");
    module.stencil = { kind: "twig", content: "<div>MODULE</div>" };

    const first = new XiboModuleTemplateDefinition("first_card", "First", "static");
    first.datatypeId = "selection-data";
    first.stencil = { kind: "twig", content: "<div>FIRST</div>" };

    const second = new XiboModuleTemplateDefinition("second_card", "Second", "static");
    second.datatypeId = "selection-data";
    second.stencil = { kind: "twig", content: "<div>SECOND</div>" };

    const generator = new XiboModuleTemplateXmlGenerator();
    return {
        moduleXml: new XiboModuleXmlGenerator().generate(module),
        singleXml: generator.generateTemplate(first),
        combinedXml: generator.generateTemplates([first, second]),
        module,
        first,
        second
    };
}

// Audit the generated document in the test, without imposing global checks on the runtime parser.
function templateIdProblems(xml) {
    const document = new XMLParser({ parseTagValue: false }).parse(xml);
    const entries = document.templates?.template ?? document.template;
    const templates = entries === undefined ? [] : Array.isArray(entries) ? entries : [entries];
    const seen = new Set();
    const problems = [];

    for (const [index, template] of templates.entries()) {
        const id = template?.id;
        if (typeof id !== "string" || !id.trim()) {
            problems.push({ kind: "missing", index });
        }
        else if (seen.has(id)) {
            problems.push({ kind: "duplicate", id, index });
        }
        else {
            seen.add(id);
        }
    }
    return problems;
}

test("#53: generated module, individual and combined XML select the right render model", async () => {
    const { moduleXml, singleXml, combinedXml } = fixtures();
    const parser = new XiboXmlParser();
    const models = new XiboRenderModelBuilder();

    const module = parser.parseInput(moduleXml);
    assert.equal(module.kind, "module");
    assert.equal(module.node.id, "selection-module");
    const moduleModel = await models.build(module.node, undefined);
    assert.equal(moduleModel.data[0].templateId, "selection-module");
    assert.deepEqual(moduleModel.twig.map(fragment => fragment.trim()), ["<div>MODULE</div>"]);

    const first = parser.parseInput(singleXml);
    assert.equal(first.kind, "template");
    assert.equal(first.node.id, "first_card");
    assert.equal(first.node.dataType, "selection-data");
    assert.deepEqual(first.node, parser.parseInput(singleXml, "first_card").node);

    const firstCombined = parser.parseInput(combinedXml, "first_card");
    const secondCombined = parser.parseInput(combinedXml, "second_card");
    assert.equal(firstCombined.kind, "template");
    assert.equal(secondCombined.kind, "template");
    assert.deepEqual(firstCombined.node, first.node);
    assert.equal(secondCombined.node.id, "second_card");
    assert.equal(secondCombined.node.dataType, "selection-data");

    const firstModel = await models.build(module.node, firstCombined.node);
    const secondModel = await models.build(module.node, secondCombined.node);
    assert.equal(firstModel.data[0].templateId, "first_card");
    assert.equal(secondModel.data[0].templateId, "second_card");
    assert.deepEqual(firstModel.twig.map(fragment => fragment.trim()), [
        "<div>FIRST</div>", "<div>MODULE</div>"
    ]);
    assert.deepEqual(secondModel.twig.map(fragment => fragment.trim()), [
        "<div>SECOND</div>", "<div>MODULE</div>"
    ]);
});

test("#53: parser rejects unselectable and malformed XML; tests audit all template IDs", () => {
    const { moduleXml, singleXml, combinedXml } = fixtures();
    const parser = new XiboXmlParser();

    assert.throws(() => parser.parseInput(combinedXml), /multiple templates; specify templateId/);
    assert.throws(() => parser.parseInput(singleXml, "second_card"), /template not found: second_card/);
    assert.throws(() => parser.parseInput(combinedXml, "unknown"), /template not found: unknown/);
    assert.throws(() => parser.parseInput(moduleXml.replace("<id>selection-module</id>", "")), /module XML has no/);

    assert.deepEqual(templateIdProblems(singleXml), []);
    assert.deepEqual(templateIdProblems(combinedXml), []);
    assert.deepEqual(
        templateIdProblems(singleXml.replace("<id>first_card</id>", "")),
        [{ kind: "missing", index: 0 }]
    );

    const missingOther = combinedXml.replace("<id>second_card</id>", "");
    assert.deepEqual(templateIdProblems(missingOther), [{ kind: "missing", index: 1 }]);
    assert.equal(parser.parseInput(missingOther, "first_card").node.id, "first_card");

    const firstNode = combinedXml.match(/<template>[\s\S]*?<\/template>/)?.[0];
    assert.ok(firstNode, "fixture must contain generated template XML");
    const duplicate = combinedXml.replace("</templates>", `${firstNode}</templates>`);
    assert.deepEqual(templateIdProblems(duplicate), [
        { kind: "duplicate", id: "first_card", index: 2 }
    ]);

    assert.throws(() => parser.parseInput("<unsupported><id>anything</id></unsupported>"), /Unsupported Xibo XML document/);
    assert.throws(() => parser.parseInput("<templates></templates>"), /template XML has no <template>/);
    assert.throws(() => parser.parseInput("<templates><template><id>broken</id></templates>"));
    assert.throws(() => parser.parseInput("<module><id>broken</id>"));
});
