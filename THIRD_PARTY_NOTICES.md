# Third-party notices

This file covers third-party material committed to **xibo-modules / xibo-workspace**. The repository's own `LICENSE` is ISC; it does not override the licenses of the separate upstream material identified here.

## Xibo CMS — mock player support

**Copyright:** Copyright (C) 2006–2026 Xibo Signage Ltd and contributors. Retain the notices in upstream files.

**License:** GNU Affero General Public License, version 3 or later (`AGPL-3.0-or-later`). License information and the link to the complete upstream license: [`LICENSES/AGPL-3.0.md`](LICENSES/AGPL-3.0.md).

**Upstream source:** https://github.com/xibosignage/xibo-cms/tree/release44 (Xibo CMS 4.4.x). The upstream `LICENSE` is at https://github.com/xibosignage/xibo-cms/blob/release44/LICENSE. Source of the host Twig template: https://github.com/xibosignage/xibo-cms/blob/release44/modules/widget-html-render.twig. The original player bundle is shipped in Xibo CMS distributions; source/build inputs are in the same upstream repository, including `modules/bundle.js` and the relevant dependencies. The user identifies the origin of the mock assets as the same official Xibo ZIP; the exact archive version has not been independently matched by hash.

**Files in this repository:**

- `src/developer/xibo-player/widget-html-render.twig`: Xibo host rendering template used by the local mock. Its original copyright/AGPL header is preserved. Only the mock uses this Xibo template; do not interpret its AGPL notice as replacing the repository's ISC `LICENSE`.
- `src/developer/xibo-player/bundle.min.js`: currently an **empty placeholder** in `main`, not a redistributed copy of compiled Xibo or third-party libraries. When populated from an Xibo distribution, retain upstream notices and identify the exact corresponding version/source (including any third-party notices bundled in it) before redistributing the binary.
- `src/developer/xibo-player/fonts.css`: locally authored mock CSS selecting locally installed fonts by name. No font files are included or redistributed.

No claim of ownership of Xibo software, trademarks or assets is made. Xibo remains the property of its respective rights holders.

## GSAP demo

`templates/projects/demo` declares `gsap` as an npm dependency. GSAP's code is not checked into this repository as a vendored library; downstream installations obtain it separately through npm under its own license and terms. Its presence as a dependency does not change the Xibo notices above.

## Redistribution notes

Retain copyright and license notices when copying Xibo material. For any nonempty Xibo JavaScript bundle distributed in object-code form, provide the applicable license text and clear access to the corresponding source of the **matching** upstream release (including build scripts and any relevant third-party component notices). These notices identify the currently committed sources; review them if new vendored assets are added. Packaging/install verification belongs to #51, not to this license inventory.