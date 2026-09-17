import { gsap } from "gsap";
import "./main.css";

let stage: HTMLElement | null = null;
let square: HTMLElement | null = null;
let running = false;

let x = 40;
let y = 100;
let vx = 230;
let vy = 170;

function initialize(id: string, target: HTMLElement) {
    stage = document.getElementById("bounce-stage");
    square = document.getElementById("bounce-square");
    target.dataset.bounceInitialized = id;
    console.log("APP: initialize", id);
}

function templateRender(id: string, target: HTMLElement) {
    target.dataset.bounceTemplateRendered = id;
    console.log("APP: templateRender", id);
}

function render(id: string, target: HTMLElement) {
    target.dataset.bounceRendered = id;
    console.log("APP: render", id);

    if (running) return;
    if (!stage || !square) {
        throw new Error("BounceTest: stage not initialized");
    }

    running = true;
    gsap.ticker.add(animate);
}

function animate(_time: number, deltaTime: number) {
    if (!stage || !square) return;

    const dt = Math.min(deltaTime / 1000, 0.05);
    const maxX = Math.max(0, stage.clientWidth - square.offsetWidth);
    const maxY = Math.max(0, stage.clientHeight - square.offsetHeight);

    x += vx * dt;
    y += vy * dt;

    if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
    } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
    }

    if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
    } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
    }

    gsap.set(square, { x, y });
}

Object.assign(window, {
    BounceTest: { initialize, templateRender, render }
});
