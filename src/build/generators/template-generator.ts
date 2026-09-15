import {
    XiboModuleTemplate
} from "../../xibo/XiboModuleTemplate.js";

import {
    XiboModuleTemplateDefinition
} from "../builders/module-definition.js";

export class XiboModuleTemplateXmlGenerator {
    
    public generate(
        definitions: XiboModuleTemplateDefinition[],
        datatypeId?: string
    ): string {
        const templates = definitions
            .map(definition => {
                const resolvedDatatypeId = datatypeId ?? definition.datatypeId;
                
                if (resolvedDatatypeId === undefined) {
                    throw new Error(`Template '${definition.id}' has no datatype.`);
                }
            
                return `
    <template>
        <id>${escapeXml(definition.id)}</id>
        <type>${escapeXml(definition.type)}</type>
        <dataType>${escapeXml(resolvedDatatypeId)}</dataType>
        <title>${escapeXml(definition.name)}</title>
    </template>`;
        })
        .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>

<templates>${templates}
</templates>
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