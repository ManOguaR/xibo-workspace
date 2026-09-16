import type { ResolvedStencil } from "xibo-modules";

import { XiboModuleDefinition } from "../xibo-build.js";

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

        const preview = this.generatePreview(definition);
        const stencil = this.generateStencil(definition);
        const assets = this.generateAssets(definition);

        const onInitialize = this.generateOnInitialize(definition);
        const onDataLoad = this.generateOnDataLoad(definition);
        const onParseData = this.generateOnParseData(definition);
        const onRender = this.generateOnRender(definition);
        const onVisible = this.generateOnVisible(definition);

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

    private generatePreview(
        definition: XiboModuleDefinition
    ): string {
        return this.generateStencilContent(
            "preview",
            definition.preview
        );
    }
    
    private generateStencil(
        definition: XiboModuleDefinition
    ): string {
        return this.generateStencilContent(
            "stencil",
            definition.stencil
        );
    }
    
    private generateStencilContent(
        tag: "preview" | "stencil",
        stencil?: ResolvedStencil
    ): string {
        if (stencil === undefined) {
            return "";
        }
        
        const content = stencil.content;
        
        const source = stencil.kind === "hbs"
            ? `\t\t<hbs${stencil.id ? ` id="${escapeXml(stencil.id)}"` : ""}>${cdata(`
${content}
\t\t`)}</hbs>\n`
            : `\t\t<twig>${cdata(`
${content}
\t\t`)}</twig>\n`;

        const head = stencil.head !== undefined
            ? `\t\t<head>${cdata(`
${stencil.head}
\t\t`)}</head>\n`
            : "";

        const style = stencil.style !== undefined
            ? `\t\t<style>${cdata(`
${stencil.style}
\t\t`)}</style>\n`
            : "";

        const width = stencil.width !== undefined
            ? `\t\t<width>${stencil.width}</width>\n`
            : "";

        const height = stencil.height !== undefined
            ? `\t\t<height>${stencil.height}</height>\n`
            : "";

        const gapBetweenHbs = stencil.gapBetweenHbs !== undefined
            ? `\t\t<gapBetweenHbs>${stencil.gapBetweenHbs}</gapBetweenHbs>\n`
            : "";

        return `\t<${tag}>
${head}${style}${width}${height}${gapBetweenHbs}${source}\t</${tag}>`;
    }

    private generateAssets(
        definition: XiboModuleDefinition
    ): string {
        if (definition.assets.length === 0) {
            return "";
        }

        const assets = definition.assets
            .map(asset => {
                const alias = asset.alias !== undefined
                    ? ` alias="${escapeXml(asset.alias)}"`
                    : "";

                const cmsOnly = asset.cmsOnly !== undefined
                    ? ` cmsOnly="${asset.cmsOnly}"`
                    : "";

                const isAutoInclude = asset.isAutoInclude !== undefined
                    ? ` isAutoInclude="${asset.isAutoInclude}"`
                    : "";

                return `\t\t<asset id="${escapeXml(asset.id)}"${alias} type="${escapeXml(asset.type)}" mimeType="${escapeXml(asset.mimeType)}"${cmsOnly}${isAutoInclude} path="${escapeXml(asset.path)}"></asset>`;
            })
            .join("\n");

        return `\t<assets>
${assets}
\t</assets>`;
    }

    private generateOnInitialize(
        definition: XiboModuleDefinition
    ): string {
        const content = definition.onInitialize?.();

        if (!content) {
            return "";
        }

        return `\t<onInitialize>${cdata(`
${content}
\t`)}</onInitialize>`;
    }

    private generateOnDataLoad(
        definition: XiboModuleDefinition
    ): string {
        const content = definition.onDataLoad?.();

        if (!content) {
            return "";
        }

        return `\t<onDataLoad>${cdata(`
${content}
\t`)}</onDataLoad>`;
    }

    private generateOnParseData(
        definition: XiboModuleDefinition
    ): string {
        const content = definition.onParseData?.();

        if (!content) {
            return "";
        }

        return `\t<onParseData>${cdata(`
${content}
\t`)}</onParseData>`;
    }

    private generateOnRender(
        definition: XiboModuleDefinition
    ): string {
        const content = definition.onRender?.();

        if (!content) {
            return "";
        }

        return `\t<onRender>${cdata(`
${content}
\t`)}</onRender>`;
    }

    private generateOnVisible(
        definition: XiboModuleDefinition
    ): string {
        const content = definition.onVisible?.();

        if (!content) {
            return "";
        }

        return `\t<onVisible>${cdata(`
${content}
\t`)}</onVisible>`;
    }
}

function escapeXml(
    value: string
): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&apos;");
}

function cdata(content: string): string {
    return `<![CDATA[${content.replaceAll(
        "]]>",
        "]]]]><![CDATA[>"
    )}]]>`;
}