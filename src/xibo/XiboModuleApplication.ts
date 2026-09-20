export abstract class XiboModuleApplication {
    rendered = false;
    isDebug = false;

    initialize(
        id: string,
        target: HTMLElement,
        properties: any,
        meta: any
    ): void {}

    abstract render(
        target: HTMLElement,
        items: any,
        properties: any,
        meta: any
    ): void;

    renderDebugInfo(target: HTMLElement): void {}

    debugUpdate(id: string): void {}
}