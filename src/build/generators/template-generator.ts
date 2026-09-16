import { XiboModuleTemplateDefinition } from "../builders/module-definition.js";

import { escapeXml, generateStencilContent, generateAssets, generateHook } from "./xml-writer.js";

export class XiboModuleTemplateXmlGenerator {

    public generateTemplate(
        definition: XiboModuleTemplateDefinition,
        datatypeId?: string
    ): string {

        return `<?xml version="1.0" encoding="UTF-8"?>

<templates>${this.generate(definition, datatypeId)}
</templates>
`;
    }

    public generateTemplates(
        definitions: XiboModuleTemplateDefinition[],
        datatypeId?: string
    ): string {

        const templates = definitions
            .map(definition =>
                this.generate(
                    definition,
                    datatypeId
                )
            )
            .join("");

        return `<?xml version="1.0" encoding="UTF-8"?>

<templates>${templates}
</templates>
`;
    }

    private generate(
        definition: XiboModuleTemplateDefinition,
        datatypeId?: string
    ): string {

        const resolvedDatatypeId = datatypeId ?? definition.datatypeId;

        if (resolvedDatatypeId === undefined) {
            throw new Error(`Template '${definition.id}' has no datatype.`);
        }

        const description = definition.description
            ? `        <description>${escapeXml(definition.description)}</description>\n`
            : "";

        const icon = definition.icon !== undefined
            ? `        <icon>${escapeXml(definition.icon)}</icon>\n`
            : "";

        const thumbnail = definition.thumbnail !== undefined
            ? `        <thumbnail>${escapeXml(definition.thumbnail)}</thumbnail>\n`
            : "";

        const isVisible = !definition.isVisible
            ? "        <isVisible>false</isVisible>\n"
            : "";

        const showIn = definition.showIn !== "both"
            ? `        <showIn>${escapeXml(definition.showIn)}</showIn>\n`
            : "";
            
        const initialSize = definition.initialSize
            ? `        <startWidth>${definition.initialSize.width}</startWidth>\n` +
              `        <startHeight>${definition.initialSize.height}</startHeight>\n`
            : "";

        const hasDimensions = !definition.hasDimensions
            ? "        <hasDimensions>false</hasDimensions>\n"
            : "";

        const canRotate = definition.canRotate
            ? "        <canRotate>true</canRotate>\n"
            : "";

        const indent = "        ";
        const childIndent = "            ";

        const stencil = generateStencilContent(
            "stencil",
            definition.stencil,
            indent,
            childIndent
        );

        const assets = generateAssets(
            definition.assets,
            indent,
            childIndent
        );

        const onTemplateRender = generateHook(
            "onTemplateRender",
            definition.onTemplateRender,
            indent
        );

        const onTemplateVisible = generateHook(
            "onTemplateVisible",
            definition.onTemplateVisible,
            indent
        );

        const onElementParseData = generateHook(
            "onElementParseData",
            definition.onElementParseData,
            indent
        );

        return `
    <template>
        <id>${escapeXml(definition.id)}</id>
        <type>${escapeXml(definition.type)}</type>
        <dataType>${escapeXml(resolvedDatatypeId)}</dataType>
        <title>${escapeXml(definition.name)}</title>
${description}${icon}${thumbnail}${isVisible}${showIn}${initialSize}${hasDimensions}${canRotate}
${stencil}

${assets}

${onTemplateRender}

${onTemplateVisible}

${onElementParseData}
    </template>`;
    }
}