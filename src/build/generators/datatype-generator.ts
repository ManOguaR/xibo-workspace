import { XiboDatatypeDefinition } from "../xibo-build.js";

export class XiboDatatypeXmlGenerator {

    public generate(
        definition: XiboDatatypeDefinition
    ): string {

        const fields = definition.fields
            .map(field => `            <field id="${escapeXml(field.id)}" type="${escapeXml(field.type)}"${field.isRequired ? ' isRequired="true"' : ""}>
                <title>${escapeXml(field.title)}</title>
            </field>`)
            .join("\n");

        const fieldsXml = fields
            ? `        <fields>\n${fields}\n        </fields>`
            : "        <fields></fields>";

        return `<?xml version="1.0" encoding="UTF-8"?>

<datatypes>
    <datatype>
        <id>${escapeXml(definition.id)}</id>
        <name>${escapeXml(definition.name)}</name>
${fieldsXml}
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