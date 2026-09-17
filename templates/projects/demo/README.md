# Bounce demo

A static Xibo template with a companion GSAP application. The Xibo hooks call the app once: `onInitialize` → `onTemplateRender` → `onRender`. The GSAP ticker owns the animation loop.

From the `xibo-workspace` directory:

```powershell
npx xibo new demo bounce-test ..\bounce-test
cd ..\bounce-test
npm install --save-dev ..\xibo-workspace
npx xibo build
npx xibo run bounce_template
```

No `xibo add static`, `xibo app add`, or Gulp is required. `npm install` resolves GSAP and Vite from this project's generated `package.json`.
