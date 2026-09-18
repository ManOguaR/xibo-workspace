import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = resolve(repo, "artifacts");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

async function command(executable, args, cwd) {
    return exec(executable, args, {
        cwd,
        timeout: 180_000,
        maxBuffer: 8 * 1024 * 1024
    });
}

const temporary = await mkdtemp(join(tmpdir(), "xibo-npm-consumer-"));
let runner;
try {
    await mkdir(artifacts, { recursive: true });
    const { stdout } = await command(npm, [
        "pack", "--json", "--pack-destination", artifacts
    ], repo);
    // npm can print prepack lifecycle output before its final JSON document.
    const jsonStart = stdout.lastIndexOf("\n[");
    const [packed] = JSON.parse(stdout.slice(jsonStart < 0 ? 0 : jsonStart + 1));
    assert.equal(packed.name, "xibo-modules");
    assert.match(packed.version, /-dev\./);

    const contents = new Map(packed.files.map(file => [file.path, file.size]));
    for (const file of [
        "dist/cli.js",
        "dist/index.js",
        "templates/projects/demo/module.ts",
        "templates/projects/demo/.bootstrap/BounceTemplate.ts",
        "src/developer/xibo-player/widget-html-render.twig",
        "src/developer/xibo-player/fonts.css",
        "THIRD_PARTY_NOTICES.md",
        "LICENSES/AGPL-3.0.md"
    ]) {
        assert.ok(contents.has(file), `npm package is missing ${file}`);
    }
    assert.ok(contents.get("src/developer/xibo-player/bundle.min.js") > 1_000_000,
        "Real Xibo development bundle is missing");
    assert.ok(contents.get("LICENSES/AGPL-3.0.txt") > 30_000,
        "Complete Xibo license is missing");
    assert.ok(![...contents.keys()].some(file => file.startsWith("tests/") ||
        file.startsWith("node_modules/") || file.startsWith("scripts/")),
        "Test/development-only code leaked into the npm archive");

    const tarball = resolve(artifacts, packed.filename);
    const consumer = resolve(temporary, "consumer");
    const project = resolve(temporary, "demo-test");
    await mkdir(consumer, { recursive: true });
    await writeFile(resolve(consumer, "package.json"),
        '{"name":"clean-consumer","private":true,"type":"module"}\n');
    await command(npm, ["install", "--no-audit", "--no-fund", "--save-dev", tarball], consumer);

    const installed = resolve(consumer, "node_modules", "xibo-modules");
    const actual = await realpath(installed);
    assert.ok(actual.startsWith(resolve(consumer, "node_modules") + sep),
        "SDK is linked to the source checkout instead of installed from a tarball");
    const consumerCli = resolve(installed, "dist", "cli.js");
    await command(process.execPath, [consumerCli, "new", "demo", "demo-test", project], consumer);

    const generated = JSON.parse(await readFile(resolve(project, "package.json"), "utf8"));
    assert.equal(generated.devDependencies["xibo-modules"], packed.version);
    await command(npm, ["install", "--no-audit", "--no-fund", "--save-dev", tarball], project);
    const projectCli = resolve(project, "node_modules", "xibo-modules", "dist", "cli.js");
    await command(process.execPath, [projectCli, "build"], project);
    await readFile(resolve(project, ".xibo", "manifest.json"), "utf8");

    let serverOutput = "";
    runner = spawn(process.execPath, [projectCli, "run", "bounce_template"], {
        cwd: project,
        stdio: ["ignore", "pipe", "pipe"]
    });
    runner.stdout.on("data", chunk => { serverOutput += chunk; });
    runner.stderr.on("data", chunk => { serverOutput += chunk; });

    let html;
    for (let i = 0; i < 80; i++) {
        if (runner.exitCode !== null) {
            throw new Error(`xibo run exited prematurely: ${serverOutput}`);
        }
        try {
            const response = await fetch("http://localhost:9696/", {
                signal: AbortSignal.timeout(1500)
            });
            if (response.ok) {
                html = await response.text();
                break;
            }
        }
        catch { /* The dev server is still starting. */ }
        await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
    }
    assert.ok(html, `xibo run did not start: ${serverOutput}`);
    assert.match(html, /bounce-stage/);
    assert.match(html, /onTemplateRender_bounce_template/);
    console.log(`PASS: ${packed.filename} installed independently; new → build → run served the demo.`);
    console.log(`Archive: ${tarball}`);
}
finally {
    if (runner && runner.exitCode === null) {
        runner.kill();
        await new Promise(resolveExit => {
            runner.once("exit", resolveExit);
            setTimeout(resolveExit, 3000).unref();
        });
    }
    await rm(temporary, { recursive: true, force: true });
}
