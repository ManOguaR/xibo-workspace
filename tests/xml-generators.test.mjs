import test from "node:test";
import assert from "node:assert/strict";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";

import {
    XiboModuleDefinition,
    XiboModuleTemplateDefinition,
    XiboDatatypeDefinition,
    XiboDatatypeField,
    XiboAssetDefinition
} from "../dist/build/builders/module-definition.js";

import {
    XiboModuleXmlGenerator
} from "../dist/build/generators/module-generator.js";

import {
    XiboModuleTemplateXmlGenerator
} from "../dist/build/generators/template-generator.js";

import {
    XiboDatatypeXmlGenerator
} from "../dist/build/generators/datatype-generator.js";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: false,
    parseTagValue: false,
    parseAttributeValue: false
});

test("datatype: emits explicit empty fields", () => {

    const definition = new XiboDatatypeDefinition(
        "xibomodules",
        "XiboModules"
    );

    const xml = new XiboDatatypeXmlGenerator().generate(definition);

    assert.equal(SyntaxValidator.validate(xml), true);
    assert.match(xml, /<fields><\/fields>/);

    const datatype = parser.parse(xml).datatypes.datatype;

    assert.equal(datatype.id, "xibomodules");
    assert.equal(datatype.name, "XiboModules");
});

test("datatype: emits fields and escapes XML", () => {

    const definition = new XiboDatatypeDefinition(
        "xibomodules",
        "XiboModules"
    );

    const field = new XiboDatatypeField(
        "player&name",
        "string",
        'Player <name> & "alias"'
    );

    field.isRequired = true;
    definition.fields.push(field);

    const xml = new XiboDatatypeXmlGenerator().generate(definition);

    assert.equal(SyntaxValidator.validate(xml), true);
    assert.match(xml, /isRequired="true"/);

    const parsed = parser.parse(xml)
        .datatypes.datatype.fields.field;

    assert.equal(parsed["@_id"], "player&name");
    assert.equal(parsed["@_type"], "string");
    assert.equal(parsed["@_isRequired"], "true");
    assert.equal(parsed.title, 'Player <name> & "alias"');
});

test("module and template: reuse stencil, assets and hooks", () => {

    const content = '<div>{{ player }} ]]> & friends</div>';
    const hook = 'console.log("render ]]>");';

    const stencil = {
        kind: "twig",
        content
    };

    const asset = new XiboAssetDefinition(
        "runtime",
        "script",
        "text/javascript",
        "/custom/modules/xibomodules/runtime.js"
    );

    asset.isAutoInclude = false;

    const moduleDefinition = new XiboModuleDefinition(
        "xibomodules",
        "XiboModules",
        "xibomodules"
    );

    moduleDefinition.initialSize = {
        width: 800,
        height: 600
    };

    moduleDefinition.stencil = stencil;
    moduleDefinition.assets.push(asset);
    moduleDefinition.onRender = () => hook;

    const templateDefinition = new XiboModuleTemplateDefinition(
        "xibomodules-static",
        "XiboModules Static",
        "static"
    );

    templateDefinition.datatypeId = "xibomodules";

    templateDefinition.initialSize = {
        width: 800,
        height: 600
    };

    templateDefinition.stencil = stencil;
    templateDefinition.assets.push(asset);
    templateDefinition.onTemplateRender = () => hook;

    const moduleXml = new XiboModuleXmlGenerator()
        .generate(moduleDefinition);

    const templateXml = new XiboModuleTemplateXmlGenerator()
        .generateTemplate(templateDefinition);

    assert.equal(SyntaxValidator.validate(moduleXml), true);
    assert.equal(SyntaxValidator.validate(templateXml), true);

    const module = parser.parse(moduleXml).module;
    const template = parser.parse(templateXml).templates.template;

    // Same stencil content through both generators.
    assert.equal(module.stencil.twig.trim(), content);
    assert.equal(template.stencil.twig.trim(), content);

    // Same asset mapping: SDK isAutoInclude -> XML autoInclude.
    assert.equal(
        module.assets.asset["@_autoInclude"],
        "false"
    );

    assert.equal(
        template.assets.asset["@_autoInclude"],
        "false"
    );

    // Same size convention translated into Xibo XML.
    for (const item of [module, template]) {
        assert.equal(item.startWidth, "800");
        assert.equal(item.startHeight, "600");
    }

    // Hooks preserve their source.
    assert.equal(module.onRender.trim(), hook);
    assert.equal(template.onTemplateRender.trim(), hook);
});

test("template: requires a resolved datatype", () => {

    const definition = new XiboModuleTemplateDefinition(
        "orphan",
        "Orphan",
        "static"
    );

    const generator = new XiboModuleTemplateXmlGenerator();

    assert.throws(
        () => generator.generateTemplate(definition),
        /has no datatype/
    );

    // The caller may supply the datatype explicitly.
    const xml = generator.generateTemplate(
        definition,
        "xibomodules"
    );

    assert.equal(SyntaxValidator.validate(xml), true);

    assert.equal(
        parser.parse(xml).templates.template.dataType,
        "xibomodules"
    );
});