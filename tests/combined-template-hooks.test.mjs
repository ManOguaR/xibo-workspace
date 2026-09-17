import test from "node:test";
import assert from "node:assert/strict";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";

import { XiboModule, XiboStaticTemplate } from "../dist/index.js";
import { XiboModuleDefinitionBuilder } from "../dist/build/builders/definition-builder.js";
import { XiboModuleTemplateXmlGenerator } from "../dist/build/generators/template-generator.js";

const parser = new XMLParser({
    trimValues: false,
    parseTagValue: false
});

test("combined template XML preserves each author's hooks without leaking or emitting absent hooks (#16)", () => {
    class DemoModule extends XiboModule {}

    class FirstTemplate extends XiboStaticTemplate {
        onTemplateRender() {
            console.log("first ]]> render");
        }

        onTemplateVisible() {
            console.log("first visible");
        }
    }

    class SecondTemplate extends XiboStaticTemplate {
        onTemplateVisible() {
            console.log("second visible");
        }
    }

    class EmptyTemplate extends XiboStaticTemplate {}

    const definition = new XiboModuleDefinitionBuilder()
        .addModule(new DemoModule(), { id: "combined-module", name: "Combined Module" })
        .addTemplate(new FirstTemplate(), { id: "first_template", name: "First" })
        .addTemplate(new SecondTemplate(), { id: "second_template", name: "Second" })
        .addTemplate(new EmptyTemplate(), { id: "empty_template", name: "Empty" })
        .build();

    const templates = definition.templateDefinitions;
    const datatypeId = definition.datatypeDefinition.id;
    const generator = new XiboModuleTemplateXmlGenerator();
    const xml = generator.generateTemplates(templates, datatypeId);

    assert.equal(SyntaxValidator.validate(xml), true);
    assert.match(xml, /]]]]><!\[CDATA\[>/, "the CDATA terminator must be split safely");

    const parsed = parser.parse(xml).templates.template;
    assert.equal(parsed.length, 3);
    assert.deepEqual(parsed.map(template => template.id), [
        "first_template", "second_template", "empty_template"
    ]);
    assert.deepEqual(parsed.map(template => template.dataType), [
        datatypeId, datatypeId, datatypeId
    ]);

    assert.equal(parsed[0].onTemplateRender.trim(), templates[0].onTemplateRender.content);
    assert.equal(parsed[0].onTemplateVisible.trim(), templates[0].onTemplateVisible.content);
    assert.match(parsed[0].onTemplateRender, /first ]]> render/);
    assert.equal(Object.hasOwn(parsed[1], "onTemplateRender"), false);
    assert.equal(parsed[1].onTemplateVisible.trim(), templates[1].onTemplateVisible.content);
    assert.equal(Object.hasOwn(parsed[2], "onTemplateRender"), false);
    assert.equal(Object.hasOwn(parsed[2], "onTemplateVisible"), false);

    for (let i = 0; i < templates.length; i++) {
        const individual = generator.generateTemplate(templates[i], datatypeId);
        assert.equal(SyntaxValidator.validate(individual), true);
        assert.deepEqual(parser.parse(individual).templates.template, parsed[i]);
    }
});
