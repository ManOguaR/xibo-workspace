# Xibo Modules
[![Xibo](https://img.shields.io/badge/Xibo-4.4.x-blue)](https://github.com/ManOguaR/xibo-workspace)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-blue)](https://github.com/ManOguaR/xibo-workspace)
[![License](https://img.shields.io/github/license/ManOguaR/xibo-workspace)](https://github.com/ManOguaR/xibo-workspace)
[![Last Commit](https://img.shields.io/github/last-commit/ManOguaR/xibo-workspace)](https://github.com/ManOguaR/xibo-workspace/commits/main)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/ManOguaR/xibo-workspace)](https://github.com/ManOguaR/xibo-workspace/commits/main)
[![Contributors](https://img.shields.io/github/contributors/ManOguaR/xibo-workspace)](https://github.com/ManOguaR/xibo-workspace/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/ManOguaR/xibo-workspace)](https://github.com/ManOguaR/xibo-workspace/issues)
[![Stars](https://img.shields.io/github/stars/ManOguaR/xibo-workspace?style=flat)](https://github.com/ManOguaR/xibo-workspace/stargazers)
[![Donate BTC](https://img.shields.io/badge/Donate-Bitcoin-F7931A?logo=bitcoin&logoColor=white)](#support-the-project)
[![Donate SOL](https://img.shields.io/badge/Donate-Solana-9945FF?logo=solana&logoColor=white)](#support-the-project)

A TypeScript toolkit and build system for authoring Xibo modules as real software projects.

`xibo-modules` is intended to bridge the gap between traditional Xibo module development — XML definitions, CMS datatypes, Twig stencils and static assets — and modern application development with TypeScript, Vite and a structured build pipeline.

The goal is not to replace Xibo.

The goal is to make building modules for Xibo feel like building software.

## What this project is

Xibo modules can range from very small widgets to surprisingly capable applications.

At the simple end, a module may be little more than:

* a module definition;
* a datatype;
* a static template;
* a Twig stencil.

At the other end, the same Xibo module system can host a dynamic application with its own JavaScript runtime, external services, real-time communication and application state.

This project is designed to cover that whole range.

A module can begin as a raw stencil backed by a CMS datatype and progressively grow into a dynamic companion application built with Vite, without abandoning the Xibo module model along the way.

```text
Xibo module source
        │
        ▼
Bootstrap discovery
        │
        ▼
Metadata + validation
        │
        ▼
Module definition model
        │
        ├──────────────► Companion application
        │                    │
        │                    ▼
        │                  Vite
        │
        ▼
Xibo XML generation
        │
        ▼
Build manifest
        │
        ▼
Package / local runtime
```

The build pipeline is deliberately more important than any individual generator.

Each feature has a defined place in the process, with known inputs and outputs, so new capabilities can be added without turning the project into a collection of unrelated scripts.

## Why

Writing a Xibo module directly is perfectly reasonable for small widgets.

The friction starts when the module becomes an application.

At that point, developers usually have to manage several concerns manually:

* Xibo module XML;
* template XML;
* datatypes;
* metadata;
* stencils;
* assets;
* JavaScript;
* build outputs;
* local development;
* packaging;
* deployment structure.

Modern frontend tooling solves many of these problems well, but it does not understand Xibo.

Xibo understands its own module system well, but it is not intended to be a general-purpose application build system.

`xibo-modules` sits between those two worlds.

## Author-facing API

Module authors work with TypeScript abstractions rather than directly assembling every build artifact.

For example:

```ts
import { XiboModule } from "xibo-modules";

export default class MyModule extends XiboModule {
}
```

Templates can express their semantics through inheritance:

```ts
import { XiboStaticTemplate } from "xibo-modules";

export default class MyTemplate extends XiboStaticTemplate {
}
```

The build system discovers those definitions, combines them with bootstrap metadata, validates the result and emits the physical Xibo artifacts.

The public API is intentionally small. Internal build machinery should not leak into module code unless it belongs to the authoring model.

## Companion applications

A Xibo module does not have to stop at Twig and static JavaScript.

A module may define a companion application that is compiled with Vite and emitted as part of the same build.

This makes it possible to use Xibo as the presentation and deployment environment while keeping application code in a normal TypeScript development workflow.

The intended progression is:

```text
static stencil
      ↓
template + datatype
      ↓
JavaScript-enhanced module
      ↓
Vite-built companion application
```

These are not separate product models. They are different levels of complexity inside the same module toolchain.

## CLI

The project exposes the `xibo` CLI.

Current command families include:

```text
xibo new
xibo add
xibo app
xibo build
xibo run
```

The CLI is responsible for orchestrating the development workflow rather than exposing the internal build implementation directly.

### Build

`xibo build` performs the complete module build pipeline.

The current build process includes:

```text
discovery
    ↓
validation
    ↓
definition composition
    ↓
companion application compilation
    ↓
Xibo definition emission
    ↓
manifest
    ↓
package stage
```

Build artifacts are collected under `.xibo/`.

A typical build currently contains artifacts such as:

```text
.xibo/
├── <module>.xml
├── <datatype>.xml
├── templates.xml
├── manifest.json
└── dist/
```

The exact structure will evolve as support for more Xibo module features is implemented.

### Run

`xibo run` provides the development path for running a built module against a local Xibo Player-oriented environment.

The local runtime is deliberately separated from author resources and production artifacts. Development infrastructure exists to simulate the environment around the module, not to become part of the module itself.

## Compatibility policy

### Current target: Xibo 4.4.x

The current major version of this project targets the **Xibo 4.4.x module system**.

This is intentional.

The project is being built against a stable Xibo generation that is already widely deployed in self-hosted environments. We prefer having a well-understood and reliable contract over continuously chasing changes in newer platform versions while both projects are still evolving.

Support for Xibo 4.5 is therefore **not a design goal for the current 1.x line**.

That also means we do not want compatibility code, abstractions or architectural compromises added merely to anticipate Xibo 4.5.

### Future 2.0

The newer Xibo module architecture is evolutionary rather than completely unrelated, but it does introduce meaningful changes.

Once the post-4.5 direction is mature and the roadmap towards 4.6+ is clear, this project is expected to move to a **2.0 generation** designed around that stable contract.

That migration should be deliberate.

We would rather evolve the model once with a clear target than permanently carry transitional complexity through the current codebase.

## Project status

This project is under active development.

The fundamental pipeline is already in place, but many parts of the Xibo module model still need to be implemented or expanded.

That is intentional.

The current architecture establishes where those capabilities belong before trying to implement every possible feature.

Expect the public API and CLI to evolve while the first complete version is being developed.

## Design principles

A few principles guide the project:

**Build a pipeline, not a collection of scripts.**

Every transformation should have a clear place in the build flow.

**Keep author code simple.**

Module authors should describe their module, not manually orchestrate the compiler.

**Preserve Xibo semantics.**

This project wraps Xibo's module system; it does not invent a parallel one.

**Use modern tooling where it adds value.**

TypeScript and Vite are used because they solve application-development problems well, not because Xibo needs to be rewritten around them.

**Do not chase unstable compatibility.**

A stable contract is more valuable than nominal support for every platform release.

**Allow complexity to grow gradually.**

A simple static module should remain simple. A complex application should have somewhere to grow.

## Contributing

Contributions are welcome.

Before working on the build system, module model or compatibility layer, please read [`CONTRIBUTING.md`](CONTRIBUTING.md).

In particular, contributors should understand the project's Xibo 4.4.x compatibility policy before proposing changes aimed at newer Xibo releases.

## Support the project

If `xibo-modules` saves you time or helps you build better Xibo modules, you can support its continued development.

### Bitcoin

**BTC · Bitcoin Network**

```text
bc1qrv2h2kjzp7ycjwrpmlsgnve4xlujw6rc5v96f9
```

### Solana

**SOL · Solana Network**

```text
2gbQraAm9ka96CnXpJATF44FHevnWtpWaWyAXQwTzjNU
```

### Stablecoins

<details>
<summary><strong>USDT — Tether</strong></summary>

<br>

| Network | Address |
| --- | --- |
| Ethereum | `0xF08Bb00E919eDb7035532DEC9023b948F11aB65f` |
| Solana | `2gbQraAm9ka96CnXpJATF44FHevnWtpWaWyAXQwTzjNU` |
| BNB Smart Chain | `0xF08Bb00E919eDb7035532DEC9023b948F11aB65f` |

</details>

<details>
<summary><strong>USDC — USD Coin</strong></summary>

<br>

| Network | Address |
| --- | --- |
| Ethereum | `0xF08Bb00E919eDb7035532DEC9023b948F11aB65f` |
| Solana | `2gbQraAm9ka96CnXpJATF44FHevnWtpWaWyAXQwTzjNU` |
| BNB Smart Chain | `0xF08Bb00E919eDb7035532DEC9023b948F11aB65f` |

</details>

> [!IMPORTANT]
> Always verify the selected network before sending funds. Transactions sent through an incompatible network may be unrecoverable.

Donations are entirely optional and do not provide special access, influence over the roadmap, or priority for contributions.

## License

ISC.
