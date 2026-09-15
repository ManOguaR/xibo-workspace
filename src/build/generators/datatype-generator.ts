import { XiboDatatypeDefinition } from "../builders/module-definition.js";


export class XiboDatatypeXmlGenerator {
    public generate(
        definition: XiboDatatypeDefinition
    ): string {
        return `<?xml version="1.0" encoding="UTF-8"?>

<datatypes>
    <datatype>
        <id>${escapeXml(definition.id)}</id>
        <name>${escapeXml(definition.name)}</name>
    </datatype>
</datatypes>
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