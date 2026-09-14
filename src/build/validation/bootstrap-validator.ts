import type { JsonObject, JsonValue, ValidationIssue, BootstrapDiscoveryResult  } from "../private-types";

export class BootstrapValidator {

    validate(bootstrap: BootstrapDiscoveryResult) : boolean {

        return bootstrap.issues.length == 0;
    }
}

export type { ValidationIssue };
