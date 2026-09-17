export class XiboPlayerHook {
    public readonly content: string;

    public constructor(method: (...args: any[]) => unknown) {
        const source = Function.prototype.toString.call(method).trim();
        
        if (/^async\b/.test(source)) {
            throw new Error("Xibo hooks cannot be async.");
        }

        const match = /^(?:function\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/.exec(source);

        if (!match) {
            throw new Error("Unsupported Xibo hook method format.");
        }

        this.content = match[1].trim();
    }
}