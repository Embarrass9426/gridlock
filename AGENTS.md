# AGENTS.md

GRIDLOCK is a single-file browser game with no package manager, dependencies, build system, tests, or CI.

## Source of truth
- `index.html` is the whole game: CSS, markup, then one ES5-style IIFE of JavaScript. Edit it directly.
- `gridlock.html` is generated and gitignored. Never edit or commit it; rebuild it with `node tools/build-standalone.mjs`.
- `assets/music/*.mp3` are the tracks the page actually loads (`menu`, `easy`, `normal`, `hard`, `extreme`). Root-level `* music.mp3` files are ignored originals; the page does not use them.
- `README.md` documents modes, controls, and features.

## Commands
- No install, test, lint, or typecheck step. Verify changes by opening `index.html` in a browser; no server is needed.
- Portable single-file build: `node tools/build-standalone.mjs` → `gridlock.html` (~34 MB, five MP3s inlined as base64).
- The build throws unless `window.__BGM_DATA` still contains the exact quoted strings `"assets/music/<track>.mp3"`. The same five track keys also live in the `tracks` array in `tools/build-standalone.mjs`.
- Deploy by pushing `main`: GitHub Pages serves the repo root (`index.html`, with `.nojekyll`). `gridlock.html` is local-only.

## Editing conventions
- `index.html` is LF-only, and `.gitattributes` sets `*.html -text` so Git never normalizes it. Do not reformat the file or introduce CRLF line endings.
- Keep the script as a dependency-free, `var`/`function`-style IIFE; match the surrounding style rather than introducing modules or libraries.
- Every user-facing string needs entries in both `I18N.en` and `I18N.zh`. Static markup uses `data-i18n`, `data-i18n-html`, or `data-i18n-aria`; dynamic text uses `t()` / `fmt()`. Missing Chinese keys silently fall back to English.
- Persist through the `store` wrapper, which prefixes keys with `gridlock.` and falls back to memory when `localStorage` is blocked. Do not call `localStorage` directly.
- Schedule deferred/VFX work with `later()`, not bare `setTimeout`: it is tracked and `clearTimers()` cancels it on restart and screen changes. Honor `reduceMotion` in new effects.
- Grid cells are `<button>` elements with a roving `tabIndex`; keep them real buttons and preserve focus/keyboard behavior.
- Touch uses a deliberate two-tap precision rule (`needsPrecision()`: coarse pointer and cells under 28px). The first tap selects, the second guesses; it is not a broken double-click.
- Background music is normalized to roughly -16 LUFS integrated (true peaks around -1.4 dBTP or lower). Match that if replacing tracks, and keep the files at 192 kbps.
- BGM volume goes through a Web Audio `GainNode`, not `HTMLMediaElement.volume`: iOS ignores volume writes on media elements. Keep the `file://` fallback, where some browsers silence `MediaElementSource` for local files.
- Adding a mode requires coordinated edits to `MODES`, `MODE_ORDER`, both `mode.<id>` i18n keys, `window.__BGM_DATA`, the build script's `tracks` array, and a new `assets/music/<id>.mp3`.
