export class HtmlSource {
    constructor(public readonly path: string) {
    }
}

export function html(path: string): HtmlSource {
    return new HtmlSource(path);
}