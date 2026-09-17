import test from "node:test";
import assert from "node:assert/strict";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";

import { XiboModule, XiboStaticTemplate } from "../dist/index.js";
import { XiboModuleDefinitionBuilder } from "../dist/build/builders/definition-builder.js";
import { XiboPlayerHook } from "../dist/build/private-types.js";
import { XiboModuleXmlGenerator } from "../dist/build/generators/module-generator.js";
import { XiboModuleTemplateXmlGenerator } from "../dist/build/generators/template-generator.js";

const parser = new XMLParser({
    trimValues: false,
    parseTagValue: false
});

test("hook: extracts only a compiled method body without executing it", () => {
    const fixture = {
        onRender() {
            throw new Error("hook must not run during build");
        }
    };

    const hook = new XiboPlayerHook(fixture.onRender);

    assert.equal(hook.content, 'throw new Error("hook must not run during build");');
});

test("hook: rejects async methods and unsupported function forms", () => {
    const fixture = {
        async onInitialize() {
            return "not synchronous";
        },
        arrow: () => {
            return "not a class method";
        }
    };

    assert.throws(
        () => new XiboPlayerHook(fixture.onInitialize),
        /Xibo hooks cannot be async/
    );
    assert.throws(
        () => new XiboPlayerHook(fixture.arrow),
        /Unsupported Xibo hook method format/
    );
});

test("hook: authored module and static-template methods traverse builder to XML", () => {
    class DemoModule extends XiboModule {
        onInitialize(id, target, properties, meta) {
            console.log("Initializing", id);
            BattleMaster.onInitialize(id, target, properties, meta);
            target.classList.add("ready");
        }

        onDataLoad(items, meta, properties, isDataReady) {
            BattleMaster.onDataLoad(items, meta, properties, isDataReady);
        }
    }

    class DemoTemplate extends XiboStaticTemplate {
        onTemplateRender(id, target, items, properties, meta) {
            BattleMaster.onTemplateRender(id, target, items, properties, meta);
        }

        onTemplateVisible(id, target, items, properties, meta) {
            BattleMaster.onTemplateVisible(id, target, items, properties, meta);
        }
    }

    const definition = new XiboModuleDefinitionBuilder()
        .addModule(new DemoModule(), {
            id: "hook-module",
            name: "Hook Module"
        })
        .addTemplate(new DemoTemplate(), {
            id: "hook-static",
            name: "Hook Static"
        })
        .build();

    const templateDefinition = definition.templateDefinitions[0];
    const moduleXml = new XiboModuleXmlGenerator().generate(definition);
    const templateXml = new XiboModuleTemplateXmlGenerator().generateTemplate(
        templateDefinition,
        definition.datatypeDefinition.id
    );

    assert.equal(SyntaxValidator.validate(moduleXml), true);
    assert.equal(SyntaxValidator.validate(templateXml), true);

    const module = parser.parse(moduleXml).module;
    const template = parser.parse(templateXml).templates.template;

    // The compiled method's body reaches CDATA verbatim, without its declaration.
    assert.match(definition.onInitialize.content, /console\.log\("Initializing", id\);/);
    assert.match(definition.onInitialize.content, /BattleMaster\.onInitialize\(id, target, properties, meta\);/);
    assert.match(definition.onInitialize.content, /target\.classList\.add\("ready"\);/);
    assert.equal(module.onInitialize.trim(), definition.onInitialize.content);
    assert.equal(module.onDataLoad.trim(), definition.onDataLoad.content);
    assert.equal(template.onTemplateRender.trim(), templateDefinition.onTemplateRender.content);
    assert.equal(template.onTemplateVisible.trim(), templateDefinition.onTemplateVisible.content);
    assert.equal(module.onInitialize.includes("onInitialize(id, target, properties, meta) {"), false);

    // Optional methods without an author implementation emit no XML hooks.
    for (const name of ["onParseData", "onRender", "onVisible"]) {
        assert.equal(Object.hasOwn(module, name), false);
    }
    assert.equal(Object.hasOwn(template, "onElementParseData"), false);
});
