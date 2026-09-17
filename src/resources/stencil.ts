import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { StencilResult } from '../build/private-types.js';

export interface StencilOptions {
    width?: number;
    height?: number;
    gapBetweenHbs?: number;
}

export interface HbsOptions extends StencilOptions {
    id?: string;
}

export abstract class StencilSource {
    public width?: number;
    public height?: number;
    public gapBetweenHbs?: number;

    private readonly getContent: () => string;
    private readonly getHead?: () => string;
    private readonly getStyle?: () => string;

    protected constructor(
        source: SourceInput,
        head?: SourceInput,
        style?: SourceInput,
        options: StencilOptions = {}
    ) {
        this.getContent = resolveSource(source)!;
        this.getHead = resolveSource(head);
        this.getStyle = resolveSource(style);

        this.width = options.width;
        this.height = options.height;
        this.gapBetweenHbs = options.gapBetweenHbs;
    }

    public resolve(): StencilResult {
        return {
            kind: "twig",
            content: this.getContent(),
            head: this.getHead?.(),
            style: this.getStyle?.(),
            width: this.width,
            height: this.height,
            gapBetweenHbs: this.gapBetweenHbs
        };
    }
}

export class HtmlSource extends StencilSource {
    constructor(source: string | (() => string), head?: string | (() => string), style?: string | (() => string), options: StencilOptions = {}) {
        super(source, head, style, options);
    }
}

export class TwigSource extends StencilSource {
    constructor(source: string | (() => string), head?: string | (() => string), style?: string | (() => string), options: StencilOptions = {}) {
        super(source, head, style, options);
    }
}

export class HbsSource extends StencilSource {
    public id?: string;

    constructor(source: string | (() => string), head?: string | (() => string), style?: string | (() => string), options: HbsOptions = {}) {
        super(source, head, style, options);
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
export function html(path: string, head: SourceInput | undefined, style?: SourceInput, options?: StencilOptions): HtmlSource;
export function html(strings: TemplateStringsArray, ...values: unknown[]): HtmlSource;

export function html(source: string | TemplateStringsArray, ...args: unknown[]): HtmlSource {
    if (typeof source !== "string") {
        return new HtmlSource(
            () => inlineContent(source, args)
        );
    }

    return new HtmlSource(source, ...sourceArgs(args));
}


export function twig(path: string, options?: StencilOptions): TwigSource;
export function twig(path: string, head: SourceInput | undefined, style?: SourceInput, options?: StencilOptions): TwigSource;
export function twig(strings: TemplateStringsArray, ...values: unknown[]): TwigSource;

export function twig(source: string | TemplateStringsArray, ...args: unknown[]): TwigSource {
    if (typeof source !== "string") {
        return new TwigSource(
            () => inlineContent(source, args)
        );
    }

    return new TwigSource(source, ...sourceArgs(args));
}


export function hbs(path: string, options?: HbsOptions): HbsSource;
export function hbs(path: string, head: SourceInput | undefined, style?: SourceInput, options?: HbsOptions): HbsSource;
export function hbs(strings: TemplateStringsArray, ...values: unknown[]): HbsSource;

export function hbs(source: string | TemplateStringsArray, ...args: unknown[]): HbsSource {
    if (typeof source !== "string") {
        return new HbsSource(
            () => inlineContent(source, args)
        );
    }

    return new HbsSource(
        source,
        ...sourceArgs(args) as [
            SourceInput | undefined,
            SourceInput | undefined,
            HbsOptions
        ]
    );
}

type SourceInput = string | (() => string);

function resolveSource(
    source?: SourceInput
): (() => string) | undefined {
    if (source === undefined) {
        return undefined;
    }

    return typeof source === "string"
        ? () => readFileSync(
            resolve(process.cwd(), ".bootstrap", source),
            "utf8"
        )
        : source;
}

function sourceArgs(
    args: unknown[]
): [SourceInput | undefined, SourceInput | undefined, StencilOptions] {
    if (
        args.length <= 1 &&
        (args[0] === undefined || typeof args[0] === "object")
    ) {
        return [
            undefined,
            undefined,
            (args[0] ?? {}) as StencilOptions
        ];
    }

    return [
        args[0] as SourceInput | undefined,
        args[1] as SourceInput | undefined,
        (args[2] ?? {}) as StencilOptions
    ];
}