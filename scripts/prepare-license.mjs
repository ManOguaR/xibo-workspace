import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Pin the license to the same Xibo 4.4.3 release used by the development mock.
const upstream = "https://raw.githubusercontent.com/xibosignage/xibo-cms/4.4.3/LICENSE";
const expectedBlob = "cebe0354b2376d78cda5d0679c87047042afde5b";
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(repository, "LICENSES", "AGPL-3.0.txt");

function gitBlobHash(content) {
    return createHash("sha1")
        .update(`blob ${content.length}\0`)
        .update(content)
        .digest("hex");
}

let license;
try {
    license = await readFile(target);
}
catch (error) {
    if (error.code !== "ENOENT") throw error;
    const response = await fetch(upstream);
    if (!response.ok) throw new Error(`Unable to retrieve Xibo license: HTTP ${response.status}`);
    license = Buffer.from(await response.arrayBuffer());
}

if (gitBlobHash(license) !== expectedBlob) {
    throw new Error("Xibo AGPL license content does not match the pinned upstream file.");
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, license);
console.log("Verified complete Xibo AGPLv3 license for npm package.");
