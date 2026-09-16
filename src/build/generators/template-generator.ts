import {
    XiboModuleTemplateDefinition
} from "../builders/module-definition.js";

export class XiboModuleTemplateXmlGenerator {

    public generateTemplate(
        definition: XiboModuleTemplateDefinition,
        datatypeId?: string
    ): string {
        return `<?xml version="1.0" encoding="UTF-8"?>

<templates>${this.generate(
    definition,
    datatypeId
)}
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
        const resolvedDatatypeId =
            datatypeId ?? definition.datatypeId;

        if (resolvedDatatypeId === undefined) {
            throw new Error(
                `Template '${definition.id}' has no datatype.`
            );
        }

        return `
    <template>
        <id>${escapeXml(definition.id)}</id>
        <type>${escapeXml(definition.type)}</type>
        <dataType>${escapeXml(resolvedDatatypeId)}</dataType>
        <title>${escapeXml(definition.name)}</title>
    </template>`;
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