export abstract class XiboModuleApplication {
    rendered = false;
    isDebug = false;

    #config: HTMLElement | null = null;

    static initialize(
        app: XiboModuleApplication,
        id: string,
        target: HTMLElement,
        properties: any,
        meta: any
    ): boolean {
        app.onPreInitialize(id, target, properties, meta);

        app.#config = target.querySelector(
            "[data-application-config]"
        );

        if (!app.#config)
            return false;

        try {
            app.onInitialize(id, target, properties, meta);
            return true;
        } catch (error) {
            console.error(`Application initialization failed: ${id}`, error);
            return false;
        }
    }

    protected getSetting(name: string): string | undefined {
        const key = `setting${name.charAt(0).toUpperCase()}${name.slice(1)}`;
        return this.#config?.dataset[key];
    }

    protected onPreInitialize(
        id: string,
        target: HTMLElement,
        properties: any,
        meta: any
    ): void {}

    protected onInitialize(
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