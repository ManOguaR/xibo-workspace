import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { XMLParser } from "fast-xml-parser";

import { XiboXmlParser, XiboRenderModelBuilder } from "../dist/developer/xml-module-parser.js";

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(repository, "dist", "cli.js");
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: false,
    parseTagValue: false,
    parseAttributeValue: false
});

test("bootstrap configuration: module/template declarations reach XML and mock defaults/overrides", {
    timeout: 120_000
}, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "xibo-config-"));
    const project = resolve(temporary, "project");

    const command = (args, cwd) => exec(process.execPath, [cli, ...args], {
        cwd,
        timeout: 90_000,
        maxBuffer: 4 * 1024 * 1024
    });

    try {
        await command(["new", "stencil", "config-probe", project], repository);
        await command(["add", "static", "ConfigTemplate"], project);
        await mkdir(resolve(project, "node_modules"));
        await symlink(repository, resolve(project, "node_modules", "xibo-modules"), "junction");

        await writeFile(resolve(project, "index.html"),
            "<section>{{ heading }} {{ settings.apiUrl }}</section>");
        await writeFile(resolve(project, "template.html"),
            "<article>{{ message }}</article>");

        await writeFile(resolve(project, ".bootstrap", "module.ts"), `
import { XiboModule, XiboSetting, XiboProperty, twig } from "xibo-modules";
export default class ConfigProbe extends XiboModule {
    propertyGroups = { content: { title: "Content", expanded: true } };
    @XiboSetting({ type: "text", title: "API URL", default: "http://localhost:5000" })
    apiUrl = "";
    @XiboProperty({ type: "text", title: "Heading", default: "Build heading", group: "content" })
    heading = "";
    stencil = twig("../index.html");
}
`);
        await writeFile(resolve(project, ".bootstrap", "ConfigTemplate.ts"), `
import { XiboStaticTemplate, XiboProperty, twig } from "xibo-modules";
export default class ConfigTemplate extends XiboStaticTemplate {
    propertyGroups = { content: { title: "Template content", expanded: true } };
    @XiboProperty({ type: "text", title: "Message", default: "Template default", group: "content" })
    message = "";
    stencil = twig("../template.html");
}
`);

        await command(["build"], project);

        const manifest = JSON.parse(await readFile(
            resolve(project, ".xibo", "manifest.json"), "utf8"
        ));
        const modulePath = manifest.module;
        const templatePath = manifest["template:config_template"];
        assert.equal(typeof modulePath, "string");
        assert.equal(typeof templatePath, "string");

        const moduleXml = xmlParser.parse(await readFile(modulePath, "utf8")).module;
        const templateXml = xmlParser.parse(await readFile(templatePath, "utf8")).templates.template;

        assert.equal(moduleXml.settings.property["@_id"], "apiUrl");
        assert.equal(moduleXml.settings.property.default, "http://localhost:5000");
        assert.equal(moduleXml.properties.property["@_id"], "heading");
        assert.equal(moduleXml.properties.property["@_propertyGroupId"], "content");
        assert.equal(moduleXml.propertyGroups.propertyGroup["@_id"], "content");
        assert.equal(templateXml.properties.property["@_id"], "message");
        assert.equal(templateXml.propertyGroups.propertyGroup["@_id"], "content");

        const parser = new XiboXmlParser();
        const module = await parser.loadModule(modulePath);
        const template = await parser.loadTemplate(templatePath, "config_template");
        const builder = new XiboRenderModelBuilder();

        const defaults = await builder.build(module, template);
        assert.equal(defaults.data[0].settings.apiUrl, "http://localhost:5000");
        assert.equal(defaults.data[0].properties.heading, "Build heading");
        assert.equal(defaults.data[0].templateProperties.message, "Template default");
        assert.match(defaults.twig.join("\n"), /Build heading http:\/\/localhost:5000/);
        assert.match(defaults.twig.join("\n"), /Template default/);

        const overrides = await builder.build(module, template, {
            settings: { apiUrl: "http://localhost:9000" },
            properties: { heading: "Runtime heading" },
            templateProperties: { message: "Runtime template" }
        });
        assert.equal(overrides.data[0].settings.apiUrl, "http://localhost:9000");
        assert.equal(overrides.data[0].properties.heading, "Runtime heading");
        assert.equal(overrides.data[0].templateProperties.message, "Runtime template");
        assert.match(overrides.twig.join("\n"), /Runtime heading http:\/\/localhost:9000/);
        assert.match(overrides.twig.join("\n"), /Runtime template/);
    }
    finally {
        await rm(temporary, { recursive: true, force: true });
    }
});
