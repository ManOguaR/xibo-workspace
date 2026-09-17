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