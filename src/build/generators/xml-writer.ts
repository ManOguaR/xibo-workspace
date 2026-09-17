import type {  XiboPropertyGroups } from "xibo-modules"
import { XiboPropertyMetadata } from "../properties-build.js";

import type { StencilResult, XiboPlayerHook } from "../private-types.js";
import type { XiboAssetDefinition } from "../xibo-build.js";

export function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&apos;");
}

export function cdata(content: string): string {
    return `<![CDATA[${content.replaceAll(
        "]]>",
        "]]]]><![CDATA[>"
    )}]]>`;
}

export function generateStencilContent(
    tag: "preview" | "stencil",
    stencil?: StencilResult,
    indent: string = "\t",
    childIndent: string = "\t\t"
): string {

    if (stencil === undefined) {
        return "";
    }

    const content = stencil.content;

    const source = stencil.kind === "hbs"
        ? `${childIndent}<hbs${stencil.id ? ` id="${escapeXml(stencil.id)}"` : ""}>${cdata(`
${content}
${childIndent}`)}</hbs>\n`
        : `${childIndent}<twig>${cdata(`
${content}
${childIndent}`)}</twig>\n`;

    const head = stencil.head !== undefined
        ? `${childIndent}<head>${cdata(`
${stencil.head}
${childIndent}`)}</head>\n`
        : "";

    const style = stencil.style !== undefined
        ? `${childIndent}<style>${cdata(`
${stencil.style}
${childIndent}`)}</style>\n`
        : "";

    const width = stencil.width !== undefined
        ? `${childIndent}<width>${stencil.width}</width>\n`
        : "";

    const height = stencil.height !== undefined
        ? `${childIndent}<height>${stencil.height}</height>\n`
        : "";

    const gapBetweenHbs = stencil.gapBetweenHbs !== undefined
        ? `${childIndent}<gapBetweenHbs>${stencil.gapBetweenHbs}</gapBetweenHbs>\n`
        : "";

    return `${indent}<${tag}>
${head}${style}${width}${height}${gapBetweenHbs}${source}${indent}</${tag}>`;
}

export function generateAssets(
    assets: XiboAssetDefinition[],
    indent: string = "\t",
    childIndent: string = "\t\t"
): string {

    if (assets.length === 0) {
        return "";
    }

    const content = assets
        .map(asset => {

            const alias = asset.alias !== undefined
                ? ` alias="${escapeXml(asset.alias)}"`
                : "";

            const cmsOnly = asset.cmsOnly !== undefined
                ? ` cmsOnly="${asset.cmsOnly}"`
                : "";

            const autoInclude = asset.isAutoInclude !== undefined
                ? ` autoInclude="${asset.isAutoInclude}"`
                : "";

            return `${childIndent}<asset id="${escapeXml(asset.id)}"${alias} type="${escapeXml(asset.type)}" mimeType="${escapeXml(asset.mimeType)}"${cmsOnly}${autoInclude} path="${escapeXml(asset.path)}"></asset>`;
        })
        .join("\n");

    return `${indent}<assets>
${content}
${indent}</assets>`;
}

export function generateHook(
    name: string,
    hook?: XiboPlayerHook,
    indent: string = "\t"
): string {
    const content = hook?.content;

    if (!content) {
        return "";
    }

    return `${indent}<${name}>${cdata(`
${content}
${indent}`)}</${name}>`;
}

export function generatePropertyCollection(
    tag: "properties" | "settings",
    definitions: readonly XiboPropertyMetadata[],
    indent = "\t",
    childIndent = "\t\t"
): string {

    const properties = definitions.map(property => {

        const group = property.group !== undefined
            ? ` propertyGroupId="${escapeXml(property.group)}"`
            : "";

        const title = property.title !== undefined
            ? `${childIndent}\t<title>${escapeXml(property.title)}</title>\n`
            : "";

        const helpText = property.helpText !== undefined
            ? `${childIndent}\t<helpText>${escapeXml(property.helpText)}</helpText>\n`
            : "";

        const defaultValue = property.default !== undefined
            ? `${childIndent}\t<default>${escapeXml(
                typeof property.default === "boolean"
                    ? (property.default ? "1" : "0")
                    : String(property.default)
            )}</default>\n`
            : "";

        return (
            `${childIndent}<property` +
            ` id="${escapeXml(property.id)}"` +
            ` type="${escapeXml(property.type)}"${group}>\n` +
            title +
            helpText +
            defaultValue +
            `${childIndent}</property>`
        );

    }).join("\n");

    return properties.length > 0
        ? `${indent}<${tag}>\n${properties}\n${indent}</${tag}>`
        : `${indent}<${tag}></${tag}>`;
}

export function generatePropertyGroups(
    groups?: XiboPropertyGroups,
    indent: string = "\t",
    childIndent: string = "\t\t"
): string {

    const entries = Object.entries(groups ?? {});

    if (entries.length === 0) {
        return "";
    }

    const content = entries.map(([id, group]) => {

        const expanded = group.expanded !== undefined
            ? ` expanded="${group.expanded}"`
            : "";

        const helpText = group.helpText !== undefined
            ? `${childIndent}\t<helpText>${escapeXml(group.helpText)}</helpText>\n`
            : "";

        return (
            `${childIndent}<propertyGroup id="${escapeXml(id)}"${expanded}>\n` +
            `${childIndent}\t<title>${escapeXml(group.title)}</title>\n` +
            helpText +
            `${childIndent}</propertyGroup>`
        );

    }).join("\n");

    return (
        `${indent}<propertyGroups>\n` +
        content + "\n" +
        `${indent}</propertyGroups>`
    );
}