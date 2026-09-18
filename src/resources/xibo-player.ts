export interface XiboPlayerInfo {
    hardwareKey?: string | null;
    currentLayoutId?: number | null;
}

export interface PlayerInfoResponse {
    responseText: string;
    status: number;
}

declare global {
    const xiboIC: {
        info(callbacks: {
            done(response: PlayerInfoResponse): void;
            error(response: PlayerInfoResponse): void;
        }): void;
    };
}