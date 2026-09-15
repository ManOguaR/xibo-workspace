import {
    XiboModuleDefinition
} from "../builders/module-definition.js";

export class XiboModuleXmlGenerator {
    public generate(
        definition: XiboModuleDefinition
    ): string {
        const datatype = definition.datatypeDefinition
            ? `    <dataType>${escapeXml(definition.datatypeDefinition.id)}</dataType>\n`
            : "";

        return `<?xml version="1.0" encoding="UTF-8"?>

<module>
    <id>${escapeXml(definition.id)}</id>
    <name>${escapeXml(definition.name)}</name>
${datatype}</module>
`;
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