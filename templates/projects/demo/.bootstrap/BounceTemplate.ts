import {
    XiboStaticTemplate,
    XiboProperty,
    TwigSource
} from "xibo-modules";

export default class BounceTemplate extends XiboStaticTemplate {
    @XiboProperty({
        type: "text",
        title: "Message",
        default: "BOUNCE TEST"
    })
    message = "";

    stencil = new TwigSource(
        () => `
            <div id="bounce-template-label">{{ message }}</div>
        `,
        undefined,
        () => `
            #bounce-template-label {
                position: fixed;
                top: 24px;
                left: 24px;
                z-index: 10;
                color: white;
                font: bold 28px Arial;
                pointer-events: none;
            }
        `
    );

    onTemplateRender(id: string, target: { 0: HTMLElement }) {
        window.BounceTest.templateRender(id, target[0]);
    }
}
