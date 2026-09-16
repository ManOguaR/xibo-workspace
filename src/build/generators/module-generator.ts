import type { ResolvedStencil } from "xibo-modules";

import { XiboModuleDefinition } from "../xibo-build.js";

import {
    escapeXml,
    generateStencilContent,
    generateAssets,
    generateHook
} from "./xml-writer.js";

export class XiboModuleXmlGenerator {

    public generate(
        definition: XiboModuleDefinition
    ): string {

        const icon = definition.icon
            ? `\t<icon>${escapeXml(definition.icon)}</icon>\n`
            : "";

        const group = definition.group
            ? `\t<group id="${escapeXml(definition.group.id)}"${
                definition.group.icon
                    ? ` icon="${escapeXml(definition.group.icon)}"`
                    : ""
            }>${escapeXml(definition.group.name)}</group>\n`
            : "";

        const thumbnail = definition.thumbnail
            ? `\t<thumbnail>${escapeXml(definition.thumbnail)}</thumbnail>\n` +
              `\t<hasThumbnail>1</hasThumbnail>\n`
            : "";

        const initialSize = definition.initialSize
            ? `\t<startWidth>${definition.initialSize.width}</startWidth>\n` +
              `\t<startHeight>${definition.initialSize.height}</startHeight>\n`
            : "";

        const allowPreview = !definition.allowPreview
            ? `\t<allowPreview>0</allowPreview>\n`
            : "";

        const showIn = definition.showIn !== "both"
            ? `\t<showIn>${escapeXml(definition.showIn)}</showIn>\n`
            : "";

        const datatype = definition.datatypeDefinition
            ? `\t<dataType>${escapeXml(definition.datatypeDefinition.id)}</dataType>\n`
            : "";

        const cacheKey =
            definition.datatypeDefinition &&
            definition.cacheKey
                ? `\t<dataCacheKey>${escapeXml(definition.cacheKey)}</dataCacheKey>\n`
                : "";

        const xmlClass = definition.datatypeDefinition
            ? `\t<class>\\Xibo\\Custom\\${definition.type}\\${definition.type}Provider</class>\n`
            : "";

        const fallbackData = this.generateFallbackData(definition);
        const sampleData = this.generateSampleData(definition);

        const settings = this.generateSettings(definition);
        const properties = this.generateProperties(definition);
        const propertyGroups = this.generatePropertyGroups(definition);
        const requiredElements = this.generateRequiredElements(definition);

        const preview = generateStencilContent("preview", definition.preview);
        const stencil = generateStencilContent("stencil", definition.stencil);
        const assets = generateAssets(definition.assets);

        const onInitialize = generateHook("onInitialize", definition.onInitialize);
        const onDataLoad = generateHook("onDataLoad", definition.onDataLoad);
        const onParseData = generateHook("onParseData", definition.onParseData);
        const onRender = generateHook("onRender", definition.onRender);
        const onVisible = generateHook("onVisible", definition.onVisible);

        return `<?xml version="1.0" encoding="UTF-8"?>

<module>
\t<id>${escapeXml(definition.id)}</id>
\t<name>${escapeXml(definition.name)}</name>
\t<author>${escapeXml(definition.author)}</author>
\t<description>${escapeXml(definition.description)}</description>

${icon}${group}${thumbnail}${initialSize}${allowPreview}${showIn}
${xmlClass}\t<type>${escapeXml(definition.type.toLowerCase())}</type>
${datatype}${cacheKey}${fallbackData}\t<schemaVersion>${escapeXml(definition.version.split(".", 1)[0])}</schemaVersion>

\t<assignable>1</assignable>
\t<regionSpecific>1</regionSpecific>

\t<renderAs>html</renderAs>
\t<defaultDuration>0</defaultDuration>

${settings}

${properties}

${propertyGroups}

${requiredElements}

${preview}

${stencil}

${assets}

${onInitialize}

${onDataLoad}

${onParseData}

${onRender}

${onVisible}

${sampleData}

</module>
`;
    }

    private generateFallbackData(
        _definition: XiboModuleDefinition
    ): string {
        return "";
    }

    private generateSampleData(
        _definition: XiboModuleDefinition
    ): string {
        return "";
    }

    private generateSettings(
        _definition: XiboModuleDefinition
    ): string {
        return `\t<settings>
\t</settings>`;
    }

    private generateProperties(
        _definition: XiboModuleDefinition
    ): string {
        return `\t<properties>
\t</properties>`;
    }

    private generatePropertyGroups(
        _definition: XiboModuleDefinition
    ): string {
        return "";
    }

    private generateRequiredElements(
        _definition: XiboModuleDefinition
    ): string {
        return "";
    }
}
