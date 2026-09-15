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

    protected constructor(
        public readonly path: string,
        options: StencilOptions = {}
    ) {
        this.head = options.head;
        this.style = options.style;

        this.width = options.width;
        this.height = options.height;

        this.gapBetweenHbs = options.gapBetweenHbs;
    }
}

export class HtmlSource extends StencilSource {

    constructor(
        path: string,
        options: StencilOptions = {}
    ) {
        super(path, options);
    }
}

export class TwigSource extends StencilSource {

    constructor(
        path: string,
        options: StencilOptions = {}
    ) {
        super(path, options);
    }
}

export class HbsSource extends StencilSource {

    public id?: string;

    constructor(
        path: string,
        options: HbsOptions = {}
    ) {
        super(path, options);

        this.id = options.id;
    }
}

export function html(
    path: string,
    options?: StencilOptions
): HtmlSource {
    return new HtmlSource(
        path,
        options
    );
}

export function twig(
    path: string,
    options?: StencilOptions
): TwigSource {
    return new TwigSource(
        path,
        options
    );
}

export function hbs(
    path: string,
    options?: HbsOptions
): HbsSource {
    return new HbsSource(
        path,
        options
    );
}