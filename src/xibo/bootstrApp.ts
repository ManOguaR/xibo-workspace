import type { XiboModuleApplication } from "./XiboModuleApplication.js"

type AppConstructor = new () => XiboModuleApplication;

class XiboAppBootstrap {
    private App?: AppConstructor;

    readonly instances = new Map<string, XiboModuleApplication>();

    register(App: AppConstructor): void {
        this.App = App;
    }

    init(
        id: string,
        target: HTMLElement,
        properties: any,
        meta: any
    ): XiboModuleApplication {
        
        const existing = this.instances.get(id);
        
        if (existing) {
            return existing;
        }
        
        if (!this.App) {
            throw new Error("Application not registered");
        }
        
        const instance = new this.App();
        
        this.instances.set(id, instance);
        instance.initialize(id, target, properties, meta);
        
        return instance;
    }

    // render(
    //     id: string,
    //     target: any,
    //     view: string,
    //     items: any,
    //     properties: any,
    //     meta: any
    // ) {
    //     const instance = this.instances.get(id);

    //     if (!instance) {
    //         throw new Error(`Instance not found: ${id}`);
    //     }

    //     const result = instance.render(
    //         view, target, items, properties, meta
    //     );

    //     instance.rendered = true;

    //     return result;
    // }
}

export const bootstrApp = new XiboAppBootstrap();

declare global {
    interface Window {
        xiboModules: typeof bootstrApp;
    }
}

if (typeof window !== "undefined") {
    window.xiboModules = bootstrApp;
}