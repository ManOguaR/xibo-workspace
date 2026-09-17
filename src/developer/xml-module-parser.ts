import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
import { createArrayLoader, createEnvironment } from "twing";

/** Parsed Xibo XML. No bootstrap/build definitions are read by this renderer. */
export type XmlNode = Record<string, unknown>;

export interface WidgetRuntime {
    widgetId?: number;
    templateId?: string;
    width?: number;
    height?: number;
    duration?: number;
    numItems?: number;
    cmsDateFormat?: string;
    locale?: string;
    isDataExpected?: boolean;
    properties?: XmlNode;
    templateProperties?: XmlNode;
    settings?: XmlNode;
}

export interface PlayerResources {
    playerBundle?: string;
    fontBundle?: string;
}

interface PlayerAsset extends XmlNode {
    id: string;
    path: string;
    mimeType: string;
    isAutoInclude(): boolean;
    isSendToPlayer(): boolean;
}

function object(value: unknown): XmlNode {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as XmlNode
        : {};
}

function array(value: unknown): unknown[] {
    return value === null || value === undefined
        ? []
        : Array.isArray(value) ? value : [value];
}

function text(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "object") return String(value);
    const node = object(value);
    return text(node["#text"]) ?? text(node.__cdata);
}

function cdata(value: unknown): string | undefined {
    const node = object(value);
    return text(node.__cdata) ?? text(value);
}

function bool(value: unknown): boolean {
    return value === true || value === 1 || value === "1" || value === "true";
}

function defaults(container: unknown): XmlNode {
    const result: XmlNode = {};
    for (const entry of array(object(container).property)) {
        const property = object(entry);
        const id = text(property.id);
        if (id && property.default !== undefined) {
            result[id] = text(property.default) ?? property.default;
        }
    }
    return result;
}

function translate(content: string): string {
    return content.replace(/\|\|(.*?)\|\|/g, "$1");
}

function append(model: XmlNode, name: string, value: unknown): void {
    if (value === undefined || value === null) return;
    const current = model[name] as unknown[] | undefined;
    if (current) current.push(value);
    else model[name] = [value];
}

function appendKey(model: XmlNode, name: string, key: string, value: unknown): void {
    if (value === undefined || value === null) return;
    const entries = (model[name] ??= {}) as XmlNode;
    entries[key] = value;
}

/** 1. XML -> Xibo XML nodes. Handles one or multiple <template> entries. */
export class XiboXmlParser {
    private readonly parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        cdataPropName: "__cdata",
        trimValues: false,
        parseTagValue: false,
        parseAttributeValue: false
    });
    
    private parse(source: string): XmlNode {
        SyntaxValidator.validate(source);
        return object(this.parser.parse(source));
    }
    
    public parseInput(
        source: string,
        templateId?: string
    ): { kind: "module" | "template"; node: XmlNode } {
        
        const xml = this.parse(source);

        if (xml.module !== undefined) {
            return {
                kind: "module",
                node: this.parseModule(source)
            };
        }

        if (xml.templates !== undefined || xml.template !== undefined) {
            return {
                kind: "template",
                node: this.parseTemplate(source, templateId)
            };
        }

        throw new Error("Unsupported Xibo XML document.");
    }

    public parseModule(source: string): XmlNode {
        const module = object(this.parse(source).module);
        if (!text(module.id)) throw new Error("Xibo module XML has no <module><id>.");
        return module;
    }

    public parseTemplate(source: string, templateId?: string): XmlNode {
        const xml = this.parse(source);
        const templates = array(object(xml.templates).template ?? xml.template)
            .map(value => object(value));
        if (templates.length === 0) throw new Error("Xibo template XML has no <template>.");

        if (templateId !== undefined) {
            const selected = templates.find(item => text(item.id) === templateId);
            if (!selected) throw new Error(`Xibo template not found: ${templateId}`);
            return selected;
        }

        if (templates.length !== 1) {
            throw new Error("Template XML contains multiple templates; specify templateId.");
        }
        return templates[0]!;
    }

    public async loadModule(path: string): Promise<XmlNode> {
        return this.parseModule(await readFile(path, "utf8"));
    }

    public async loadTemplate(path: string, templateId?: string): Promise<XmlNode> {
        return this.parseTemplate(await readFile(path, "utf8"), templateId);
    }
}

/** 2. Xibo XML nodes -> context consumed by widget-html-render.twig. */
export class XiboRenderModelBuilder {
    public async build(
        moduleXml: XmlNode,
        templateXml: XmlNode | undefined,
        runtime: WidgetRuntime = {}
    ): Promise<XmlNode> {
        const widgetId = runtime.widgetId ?? 123;
        const templateId = text(templateXml?.id) ?? text(moduleXml.id)!;
        const properties = { ...defaults(moduleXml.properties), ...runtime.properties };
        const templateProperties = {
            ...defaults(templateXml?.properties),
            ...runtime.templateProperties
        };
        const settings = { ...defaults(moduleXml.settings), ...runtime.settings };
        const parsedDuration = Number(text(moduleXml.defaultDuration));
        const duration = runtime.duration ?? (
            Number.isFinite(parsedDuration) ? parsedDuration : 0
        );
        const isDataExpected = runtime.isDataExpected ?? (templateXml !== undefined);
        const data: XmlNode = {
            widgetId,
            templateId,
            properties,
            templateProperties,
            isValid: true,
            isRepeatData: true,
            duration,
            calculatedDuration: duration,
            isDataExpected: isDataExpected
        };
        
        if (isDataExpected && templateXml) {
            data.url = null;
            data.data = { data: [], meta: {} };
        }
        
        const sample = cdata(moduleXml.sampleData);
        if (sample !== undefined) {
            try { data.sample = JSON.parse(sample) as unknown; }
            catch { data.sample = sample; }
        }

        const model: XmlNode = {
            widgetId,
            width: runtime.width ?? 1920,
            height: runtime.height ?? 1080,
            duration,
            numItems: runtime.numItems ?? 0,
            cmsDateFormat: runtime.cmsDateFormat ?? "DD/MM/YYYY",
            locale: runtime.locale ?? "es",
            data: [data],
            elements: [],
            twig: [],
            head: [],
            style: [],
            hbs: {},
            assets: []
        };

        this.hooks(moduleXml, model, String(widgetId));
        if (templateXml) {
            this.hooks(templateXml, model, templateId);
            await this.templateStencil(templateXml, model, templateProperties);
        }
        await this.moduleStencil(moduleXml, model, properties, settings);
        this.assets(moduleXml, model);
        if (templateXml) this.assets(templateXml, model);
        return model;
    }

    private hooks(source: XmlNode, model: XmlNode, key: string): void {
        for (const [name, node] of Object.entries(source)) {
            if (name.startsWith("on")) {
                appendKey(model, name, key, cdata(node));
            }
        }
    }

    private async fragment(content: string, context: XmlNode): Promise<string> {
        const environment = createEnvironment(createArrayLoader({
            fragment: translate(content)
        }));
        return environment.render("fragment", context);
    }

    private async moduleStencil(
        moduleXml: XmlNode,
        model: XmlNode,
        properties: XmlNode,
        settings: XmlNode
    ): Promise<void> {
        const stencil = object(moduleXml.stencil);
        const twig = cdata(stencil.twig);
        if (twig !== undefined) {
            append(model, "twig", await this.fragment(twig, { ...properties, settings }));
        }
        const hbs = cdata(stencil.hbs);
        if (hbs !== undefined) {
            appendKey(model, "hbs", "module", {
                content: translate(hbs),
                width: text(stencil.width),
                height: text(stencil.height),
                gapBetweenHbs: text(stencil.gapBetweenHbs),
                extends: {}
            });
        }
        const head = cdata(stencil.head);
        if (head !== undefined) append(model, "head", await this.fragment(head, properties));
        const style = cdata(stencil.style);
        if (style !== undefined) {
            append(model, "style", {
                content: await this.fragment(style, properties),
                type: text(moduleXml.type),
                datatype: text(moduleXml.dataType ?? moduleXml.datatype)
            });
        }
    }

    private async templateStencil(
        templateXml: XmlNode,
        model: XmlNode,
        properties: XmlNode
    ): Promise<void> {
        const stencil = object(templateXml.stencil);
        const twig = cdata(stencil.twig);
        if (twig !== undefined) {
            append(model, "twig", await this.fragment(twig, properties));
        }
        const hbs = cdata(stencil.hbs);
        if (hbs !== undefined) {
            const extended = object(templateXml.extends);
            appendKey(model, "hbs", text(templateXml.id) ?? "template", {
                content: translate(hbs),
                width: text(stencil.width),
                height: text(stencil.height),
                gapBetweenHbs: text(stencil.gapBetweenHbs),
                extends: {
                    override: text(extended.override),
                    with: text(extended.with),
                    escapeHtml: extended.escapeHtml === undefined || bool(extended.escapeHtml)
                }
            });
        }
        const head = cdata(stencil.head);
        if (head !== undefined) append(model, "head", translate(head));
        const style = cdata(stencil.style);
        if (style !== undefined) {
            append(model, "style", {
                content: text(templateXml.type) === "static"
                    ? await this.fragment(style, properties)
                    : translate(style),
                type: text(templateXml.type),
                datatype: text(templateXml.dataType ?? templateXml.datatype),
                templateId: text(templateXml.id)
            });
        }
    }

    private assets(source: XmlNode, model: XmlNode): void {
        for (const entry of array(object(source.assets).asset)) {
            const asset = object(entry);
            const id = text(asset.id);
            const path = text(asset.path);
            const mimeType = text(asset.mimeType ?? asset.mime);
            if (!id || !path || !mimeType || bool(asset.cmsOnly)) continue;
            if (mimeType !== "text/css" && mimeType !== "text/javascript") continue;

            // The satellite writes autoInclude; xibo-modules emits isAutoInclude.
            const autoInclude = bool(asset.isAutoInclude ?? asset.autoInclude);
            const playerAsset: PlayerAsset = {
                ...asset,
                id,
                path,
                mimeType,
                isAutoInclude: () => autoInclude,
                isSendToPlayer: () => true
            };
            append(model, "assets", playerAsset);
        }
    }
}

/** 3. Render the existing Xibo Twig host, without starting a web server. */
export class XiboTwigRenderer {
    public async render(templateSource: string, model: XmlNode): Promise<string> {
        const environment = createEnvironment(createArrayLoader({
            "widget-html-render.twig": templateSource
        }));
        return environment.render("widget-html-render.twig", model);
    }
}

/** 4. Replace only placeholders for which the compiled XML gives a value. */
export class XiboPlayerAdapter {
    public decorate(
        html: string,
        model: XmlNode,
        resources: PlayerResources = {}
    ): string {
        const assets = array(model.assets) as PlayerAsset[];
        const paths = new Map(assets.map(asset => [asset.id, asset.path]));

        return html
            .replaceAll("[[ViewPortWidth]]", String(model.width))
            .replaceAll("[[PlayerBundle]]", resources.playerBundle ?? "./bundle.min.js")
            .replaceAll("[[FontBundle]]", resources.fontBundle ?? "./fonts.css")
            .replace(/\[\[assetId=([^\]]+)\]\]/g, (_token, id: string) => {
                const path = paths.get(id);
                if (path === undefined) throw new Error(`Unresolved Xibo asset: ${id}`);
                return path;
            });
    }
}

/** Ports the satellite's renderWidget entry point; does not own xibo run or Vite. */
export class XiboWidgetRenderer {
    public constructor(
        private readonly xml = new XiboXmlParser(),
        private readonly models = new XiboRenderModelBuilder(),
        private readonly twig = new XiboTwigRenderer(),
        private readonly player = new XiboPlayerAdapter()
    ) {}

    public async render(
        xmlPath: string,
        distRoot: string,
        hostTwigPath: string,
        runtime: WidgetRuntime = {},
        resources: PlayerResources = {}
    ): Promise<string> {
        const input = this.xml.parseInput(
            await readFile(xmlPath, "utf8"),
            runtime.templateId
        );
        
        let moduleXml: XmlNode;
        let templateXml: XmlNode | undefined;
        
        if (input.kind === "module") {
            moduleXml = input.node;
        }
        else {
            templateXml = input.node;
            moduleXml = await this.resolveModule(templateXml, distRoot);
        }

        const hostTwig = await readFile(hostTwigPath, "utf8");
        const model = await this.models.build(moduleXml, templateXml, runtime);
        const html = await this.twig.render(hostTwig, model);
        return this.player.decorate(html, model, resources);
    }

    private async resolveModule(
        templateXml: XmlNode,
        distRoot: string
    ): Promise<XmlNode> {
        
        const datatypeId = text(templateXml.dataType ?? templateXml.datatype);
        
        if (!datatypeId) {
            throw new Error(`Template '${text(templateXml.id)}' has no dataType.`);
        }
        
        const modulesRoot = resolve(distRoot, "modules");
        
        const entries = await readdir(modulesRoot, {
            withFileTypes: true
        });
        
        const matches: XmlNode[] = [];
        
        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith(".xml")) {
                continue;
            }
            
            const moduleXml = await this.xml.loadModule(resolve(modulesRoot, entry.name));
            
            const moduleDatatypeId = text(moduleXml.dataType ?? moduleXml.datatype);
            
            if (moduleDatatypeId === datatypeId) {
                matches.push(moduleXml);
            }
        }
        
        if (matches.length === 0) {
            throw new Error(`No module found for datatype '${datatypeId}'.`);
        }
        
        if (matches.length > 1) {
            throw new Error(
                `Multiple modules found for datatype '${datatypeId}': ` +
                matches.map(module => text(module.id)).join(", ")
            );
        }
        
        return matches[0]!;
    }
}
