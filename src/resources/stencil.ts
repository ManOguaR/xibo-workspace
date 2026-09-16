import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { StencilResult } from '../build/private-types.js';

export interface StencilOptions {
    head?: string;
    style?: string;
    width?: number;
    height?: number;
    gapBetweenHbs?: number;
}

export interface HbsOptions extends StencilOptions {
    id?: string;
}

export abstract class StencilSource {
    public head?: string;
    public style?: string;
    public width?: number;
    public height?: number;
    public gapBetweenHbs?: number;

    // Future development
    // public elements?: unknown;
    // public elementGroups?: unknown;

    private readonly getContent: () => string;

    protected constructor(
        source: string | (() => string),
        options: StencilOptions = {}
    ) {
        // The source owns its file resolution. No filename crosses into the XML definition.
        this.getContent = typeof source === "string"
            ? () => readFileSync(resolve(process.cwd(), ".bootstrap", source), "utf8")
            : source;

        this.head = options.head;
        this.style = options.style;
        this.width = options.width;
        this.height = options.height;
        this.gapBetweenHbs = options.gapBetweenHbs;
    }

    public resolve(): StencilResult {
        return {
            kind: "twig",
            content: this.getContent(),
            head: this.head,
            style: this.style,
            width: this.width,
            height: this.height,
            gapBetweenHbs: this.gapBetweenHbs
        };
    }
}

export class HtmlSource extends StencilSource {
    constructor(source: string | (() => string), options: StencilOptions = {}) {
        super(source, options);
    }
}

export class TwigSource extends StencilSource {
    constructor(source: string | (() => string), options: StencilOptions = {}) {
        super(source, options);
    }
}

export class HbsSource extends StencilSource {
    public id?: string;

    constructor(source: string | (() => string), options: HbsOptions = {}) {
        super(source, options);
        this.id = options.id;
    }

    public override resolve(): StencilResult {
        return {
            ...super.resolve(),
            kind: "hbs",
            id: this.id
        };
    }
}

function inlineContent(strings: TemplateStringsArray, values: unknown[]): string {
    return strings.reduce(
        (result, fragment, index) =>
            result + fragment + (index < values.length ? String(values[index]) : ""),
        ""
    );
}

export function html(path: string, options?: StencilOptions): HtmlSource;
export function html(strings: TemplateStringsArray, ...values: unknown[]): HtmlSource;
export function html(source: string | TemplateStringsArray, ...args: unknown[]): HtmlSource {
    return typeof source === "string"
        ? new HtmlSource(source, args[0] as StencilOptions | undefined)
        : new HtmlSource(() => inlineContent(source, args));
}

export function twig(path: string, options?: StencilOptions): TwigSource;
export function twig(strings: TemplateStringsArray, ...values: unknown[]): TwigSource;
export function twig(source: string | TemplateStringsArray, ...args: unknown[]): TwigSource {
    return typeof source === "string"
        ? new TwigSource(source, args[0] as StencilOptions | undefined)
        : new TwigSource(() => inlineContent(source, args));
}

export function hbs(path: string, options?: HbsOptions): HbsSource;
export function hbs(strings: TemplateStringsArray, ...values: unknown[]): HbsSource;
export function hbs(source: string | TemplateStringsArray, ...args: unknown[]): HbsSource {
    return typeof source === "string"
        ? new HbsSource(source, args[0] as HbsOptions | undefined)
        : new HbsSource(() => inlineContent(source, args));
}
