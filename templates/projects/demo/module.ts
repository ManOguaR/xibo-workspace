import {
    XiboModule,
    XiboProperty,
    XiboSetting,
    TwigSource
} from "xibo-modules";

export default class __MODULE_NAME__ extends XiboModule {
    propertyGroups = {
        appearance: {
            title: "Appearance",
            expanded: true
        }
    };

    @XiboSetting({
        type: "text",
        title: "Test label",
        default: "Xibo → Application"
    })
    testLabel = "";

    @XiboProperty({
        type: "text",
        title: "Background",
        default: "#101827",
        group: "appearance"
    })
    background = "";

    @XiboProperty({
        type: "text",
        title: "Square color",
        default: "#00ffcc",
        group: "appearance"
    })
    squareColor = "";

    stencil = new TwigSource(
        () => `
            <main id="bounce-stage">
                <div id="bounce-square"></div>
                <div id="bounce-status">{{ settings.testLabel }}</div>
            </main>
        `,
        undefined,
        () => `
            #bounce-stage {
                position: fixed;
                inset: 0;
                overflow: hidden;
                background: {{ background }};
            }

            #bounce-square {
                position: absolute;
                width: 80px;
                height: 80px;
                border-radius: 12px;
                background: {{ squareColor }};
                will-change: transform;
            }

            #bounce-status {
                position: absolute;
                bottom: 24px;
                left: 24px;
                color: white;
                font: 16px Arial;
                opacity: 0.65;
            }
        `,
        { width: 1920, height: 1080 }
    );

    onInitialize(id: string, target: { 0: HTMLElement }) {
        // This body is copied into player JavaScript: keep it plain JS.
        window.BounceTest.initialize(id, target[0]);
    }

    onRender(id: string, target: { 0: HTMLElement }) {
        window.BounceTest.render(id, target[0]);
    }
}
