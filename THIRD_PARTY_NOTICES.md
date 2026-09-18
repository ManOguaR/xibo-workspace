# Third-party notices

This file identifies third-party materials supplied with `xibo-modules`. The repository's own `LICENSE` is ISC; it does not replace the licenses governing upstream Xibo material.

## Xibo CMS 4.4.x — local development player

- **Copyright:** Xibo Signage Ltd and contributors. Copyright notices in upstream files are preserved.
- **License:** GNU Affero General Public License version 3 or later (`AGPL-3.0-or-later`). The complete license is included as `LICENSES/AGPL-3.0.txt` in the npm archive. See also `LICENSES/AGPL-3.0.md` for the official upstream text and license information.
- **Official source:** https://github.com/xibosignage/xibo-cms/tree/release44
- **Xibo CMS 4.4.3 release and source:** https://github.com/xibosignage/xibo-cms/releases/tag/4.4.3 and https://github.com/xibosignage/xibo-cms/tree/4.4.3
- **Twig source:** https://github.com/xibosignage/xibo-cms/blob/4.4.3/modules/widget-html-render.twig
- **Bundle build source:** https://github.com/xibosignage/xibo-cms/blob/4.4.3/modules/bundle.js and the source dependencies/build inputs in that release.

The development assets originated from an official Xibo CMS distribution ZIP, as identified by the project maintainer. An independent binary hash match to a specific release archive has not been recorded; the source links above describe the target 4.4.x line and its pinned 4.4.3 reference.

Included files:

- `src/developer/xibo-player/widget-html-render.twig`: upstream Twig host; original copyright and AGPL header restored.
- `src/developer/xibo-player/bundle.min.js`: **nonempty compiled Xibo player bundle (~2.3 MB)** used by the local mock. It may include third-party JavaScript with separate notices; preserve the notices included in the bundle and use the matching Xibo source when distributing or replacing it.
- `src/developer/xibo-player/fonts.css`: locally authored mock CSS referring to fonts installed on the user's machine. No font binaries are bundled.

The Xibo assets are distributed for local development and are not claimed to be original SDK code. Attribution does not imply endorsement by Xibo.

## GSAP demo

`templates/projects/demo` declares `gsap` as an npm dependency. No GSAP library binary is vendored into this SDK. Users installing the demo obtain GSAP separately through npm under GSAP's own license and terms.

## Redistribution

Preserve upstream notices. When redistributing compiled Xibo code, include its full AGPL license and ensure the corresponding matching source, build scripts, and relevant third-party notices remain accessible. The SDK's own license does not supersede these obligations. Installation and npm packaging tests are tracked separately in issue #51.
