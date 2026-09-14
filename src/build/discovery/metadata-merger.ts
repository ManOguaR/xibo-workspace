import { JsonObject, JsonValue } from "../private-types";

export class MetadataMerger {
    merge(
        ...sources: Array<JsonObject | undefined>
    ): JsonObject {
        const result: JsonObject = {};

        for (const source of sources) {
            if (source === undefined) {
                continue;
            }

            this.mergeObject(
                result,
                source
            );
        }

        return result;
    }

    private mergeObject(
        target: JsonObject,
        source: JsonObject
    ): void {
        for (const [key, value] of Object.entries(source)) {
            const current = target[key];

            if (
                this.isObject(current) &&
                this.isObject(value)
            ) {
                this.mergeObject(
                    current,
                    value
                );

                continue;
            }

            target[key] = value;
        }
    }

    private isObject(
        value: JsonValue | undefined
    ): value is JsonObject {
        return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        );
    }
}

export { JsonObject, JsonValue }
