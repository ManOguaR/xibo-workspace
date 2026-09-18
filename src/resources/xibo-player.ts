export interface XiboICResponse {
    status: number;
    responseText: string;
}

export interface XiboICPlayerInfo {
    hardwareKey: string;
    displayName: string;
    timeZone: string;
    latitude: number | null;
    longitude: number | null;
    currentLayoutId?: number;
}

export interface XiboICRequestOptions {
    done?: (response: XiboICResponse) => void;
    error?: (response: XiboICResponse) => void;
}

export interface XiboICTargetOptions extends XiboICRequestOptions {
    targetId?: string | number;
}

export interface XiboICConfig {
    protocol?: string;
    hostName?: string;
    port?: string;
    headers?: Array<{
        key: string;
        value: string;
    }>;
}

export interface XiboIC {

    // Configuration
    config(options?: XiboICConfig): void;
    setTargetId(targetId: string | number): void;

    // Player information
    info(options?: XiboICRequestOptions): void;

    // Player actions
    trigger(code: string, options?: XiboICTargetOptions): void;
    expireNow(options?: XiboICTargetOptions): void;
    extendWidgetDuration(
        duration: number,
        options?: XiboICTargetOptions
    ): void;
    setWidgetDuration(
        duration: number,
        options?: XiboICTargetOptions
    ): void;

    // Fault reporting
    reportFault(
        params?: {
            code?: number;
            reason?: string;
            key?: string;
        },
        options?: XiboICTargetOptions
    ): void;

    // Visibility and execution queue
    checkVisible(): boolean;
    checkIsPreview(): boolean;
    checkIsEditor(): boolean;

    addToQueue(
        callback: (...args: any[]) => void,
        ...args: any[]
    ): void;

    runQueue(): void;
    setVisible(): void;

    // Interaction controls
    lockTextSelection(lock?: boolean): void;
    lockContextMenu(lock?: boolean): void;
    lockPinchZoom(lock?: boolean): void;
    lockAllInteractions(lock?: boolean): void;

    // Widget-scoped values and methods
    set(
        widgetId: string | number,
        name: string,
        value: unknown
    ): void;

    get(
        widgetId: string | number,
        name: string
    ): unknown;

    call(
        widgetId: string | number,
        name: string,
        ...args: any[]
    ): unknown;

    // Realtime data
    getData(
        dataKey: string,
        options?: {
            done?: (status: number, data: unknown) => void;
            error?: (status: number, data?: unknown) => void;
        }
    ): void;

    registerNotifyDataListener(
        callback: (dataKey: string) => void
    ): void;

    notifyData(dataKey: string): void;
}

// Global exposed by Xibo's JavaScript runtime.
declare global {
    const xiboIC: XiboIC;

    interface Window {
        xiboIC: XiboIC;
    }
}