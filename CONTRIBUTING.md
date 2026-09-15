# Contributing to Xibo Modules

Contributions are welcome.

This project is still young, which makes contributions particularly valuable — but it also means architectural consistency matters more than accumulating features quickly.

Before writing code, please understand the pipeline and the compatibility policy described below.

## The important rule

**Do not treat this repository as a collection of independent utilities.**

`xibo-modules` is a build system.

A feature normally belongs somewhere in this flow:

```text
source / bootstrap
        ↓
discovery
        ↓
validation
        ↓
definition composition
        ↓
compilation
        ↓
resource collection / transformation
        ↓
Xibo emission
        ↓
manifest
        ↓
packaging
        ↓
development runtime / publication
```

If a change introduces a new capability, the first question should be:

> Where does this capability belong in the pipeline?

Not:

> Where can we put some code that makes it work?

A locally convenient solution that bypasses the pipeline is usually not an improvement.

## Compatibility target

The current 1.x development line targets:

**Xibo 4.4.x**

This is a deliberate architectural constraint.

Please do not add compatibility paths for Xibo 4.5 or speculative support for future Xibo versions unless the project explicitly changes its compatibility target.

That includes:

* version checks for 4.5;
* alternate serializers for 4.5;
* compatibility abstractions that only exist because 4.5 behaves differently;
* model changes designed around the newer module architecture;
* "future-proofing" for undocumented or unstable platform behavior.

The purpose of the 1.x line is to build a clean model against a stable Xibo contract.

Once the newer module system has matured and the roadmap around Xibo 4.6+ is sufficiently clear, the project is expected to address it as a deliberate **2.0 evolution**.

We do not want the 1.x architecture to become a permanent compatibility bridge between two generations.

## Xibo semantics come first

This project provides abstractions around Xibo concepts, but those abstractions should preserve the underlying semantics.

For example:

* module definitions remain module definitions;
* datatypes remain Xibo datatypes;
* templates retain their Xibo template semantics;
* template type belongs to the template model;
* Xibo build artifacts remain understandable as Xibo artifacts.

Avoid introducing abstractions solely to hide the fact that Xibo exists.

The toolkit should make Xibo development easier, not create a second unrelated framework that happens to emit Xibo XML.

## Author API vs build internals

There is an important boundary between the API used by module authors and the machinery used by the toolchain.

Author-facing code lives around concepts such as:

```text
XiboModule
XiboModuleTemplate
XiboStaticTemplate
XiboElementTemplate
HtmlSource
```

These types should remain small and expressive.

Build internals may contain much more information:

```text
bootstrap discovery
metadata
validation results
module definitions
template definitions
datatype definitions
companion application definitions
generators
manifests
```

Do not expose internal build state through the public author API simply because it is convenient for an implementation.

The public model should describe the module.

The build model should describe what the compiler knows about the module.

Those are related, but they are not the same responsibility.

## Definitions are the build boundary

Discovery should not leak indefinitely through the build.

The intended direction is:

```text
author sources
      +
bootstrap metadata
      ↓
discovery
      ↓
XiboModuleDefinition
      ↓
downstream build stages
```

Once a complete definition has been constructed, downstream stages should consume that definition rather than rediscovering bootstrap sources.

Generators in particular should serialize definition objects. They should not perform discovery.

This keeps the pipeline deterministic and makes each stage independently understandable.

## Generators should serialize, not decide architecture

XML generators are intentionally narrow.

A generator should generally answer:

> How is this definition represented as Xibo XML?

It should not become responsible for:

* discovering files;
* deciding project structure;
* running Vite;
* resolving bootstrap metadata;
* orchestrating unrelated generators;
* packaging the complete module.

Higher-level build orchestration owns those responsibilities.

Keeping serializers boring is a feature.

## Companion applications

Companion applications are normal application code compiled as part of the Xibo module build.

Vite currently provides that compilation layer.

The companion application is not a replacement for the Xibo module definition. It is one possible runtime component of that module.

Changes in this area should preserve the distinction:

```text
Xibo module
    │
    ├── Xibo definitions
    ├── templates / datatypes / resources
    └── optional companion application
```

Do not restructure the project as if every module were necessarily a frontend application.

Static and minimal modules are first-class use cases.

## Development runtime

The local Xibo Player-oriented runtime exists for development.

Development infrastructure should remain separate from module resources and production output.

In particular, Player mocks, support assets and local server machinery should not silently become part of the author-facing resource model or production package.

The development runtime should consume build results rather than inventing an alternative build path.

## Build artifacts

`.xibo/` is the build output.

The build should produce a coherent result that later stages can consume.

The manifest provides a machine-readable description of emitted artifacts and is intended to become an important boundary between build, packaging and development tooling.

Avoid downstream code that rediscovers information already produced by the build if that information can instead be represented explicitly in the manifest.

## Prefer end-to-end coherence over isolated completeness

This project intentionally develops the pipeline before every individual feature is complete.

A placeholder at the correct architectural boundary may be more valuable than a fully implemented subsystem with no defined place in the product.

When adding functionality, prefer:

```text
incomplete capability
inside the correct flow
```

over:

```text
complete capability
connected through a temporary parallel path
```

Temporary shortcuts have a habit of becoming permanent architecture.

## Keep changes small

Small changes are strongly preferred.

A good contribution usually:

1. identifies one missing capability;
2. locates its place in the existing pipeline;
3. extends the smallest relevant model;
4. implements the transformation;
5. verifies the resulting build behavior.

Avoid speculative refactors around unrelated areas.

If an architectural change is necessary, explain the problem it solves before changing the architecture.

## Do not refactor placeholders away accidentally

Some apparently empty methods, classes or stages exist because they represent an intentional future boundary in the pipeline.

Before deleting or collapsing one, determine whether it is:

* accidental dead code; or
* deliberate scaffolding for a known responsibility.

The second case should generally remain until that responsibility is implemented.

The architecture of an unfinished build system is partly expressed by those boundaries.

## Verify before declaring a defect

When reviewing the codebase, distinguish between:

* something that looks suspicious;
* something that may become a problem;
* a confirmed defect.

Follow imports, exports and build flow far enough to understand the actual behavior.

Whenever practical, compile or execute the relevant path before stating that it is broken.

In a build system, local inspection of one file is often insufficient to understand the effective behavior of the whole pipeline.

## Coding style

The project is written in TypeScript using ES modules.

Keep code straightforward.

Prefer:

* explicit responsibilities;
* small methods;
* semantic types;
* normal Node.js APIs;
* clear pipeline boundaries;
* simple transformations.

Avoid introducing frameworks, dependency injection containers, generalized plugin systems or architectural layers unless the problem being solved actually requires them.

A small build system should remain understandable.

## Pull requests

A useful pull request description should explain:

* what capability is being added or corrected;
* where it belongs in the build pipeline;
* what input it consumes;
* what output or observable behavior it changes;
* how the change was verified.

For compatibility-related changes, also identify the relevant Xibo 4.4.x behavior or contract.

Large architectural changes should be discussed before implementation.

## What we are interested in

Contributions are particularly useful around:

* Xibo 4.4.x module-definition coverage;
* templates;
* datatypes and fields;
* stencils;
* properties and settings;
* assets;
* render hooks;
* validation;
* build manifests;
* packaging;
* development runtime fidelity;
* CLI ergonomics;
* documentation;
* tests around established pipeline behavior.

This list is not exhaustive.

The important part is that new functionality fits coherently into the existing model.

## What we are not interested in right now

For the current 1.x line, please avoid contributions whose primary purpose is:

* Xibo 4.5 compatibility;
* speculative Xibo 5.x compatibility;
* redesigning the project around the newer module system;
* replacing Xibo concepts with a new generic widget framework;
* introducing abstraction layers without a concrete current requirement.

Those ideas may become relevant for 2.0.

They are intentionally outside the current target.

## Questions and design discussions

If you are unsure where a feature belongs, open a discussion or issue before implementing a large solution.

A short architectural conversation is preferable to a large pull request that solves the right problem in the wrong layer.

The project is moving quickly, but the objective is not merely to move quickly.

The objective is to leave behind a build system that remains understandable when it is no longer small.
