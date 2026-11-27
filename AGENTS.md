# AGENTS.md

GRIDLOCK is a browser game with no package manager, dependencies, build system, tests, or CI.

## Source of truth
- `index.html` is the markup; `styles.css` is all styling; `game.js` contains the ES5-style IIFE with game logic, audio, i18n, and VFX. Edit these directly.
- `assets/music/*.mp3` are the tracks the page actually loads (`menu`, `easy`, `normal`, `hard`, `extreme`, plus the hidden `drift` boss track). Root-level `* music.mp3` files are ignored originals; the page does not use them.
- `README.md` documents modes, controls, and features.

## Commands
- No install, test, lint, or typecheck step. Verify changes by opening `index.html` in a browser; no server is needed.
- Deploy by pushing `main`: GitHub Pages serves the repo root (`index.html` plus its sibling CSS/JS/assets, with `.nojekyll`). There is no standalone build artifact.

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
- Adding a mode requires coordinated edits to `MODES`, `MODE_ORDER`, both `mode.<id>` i18n keys, `window.__BGM_DATA` in `game.js`, and a new `assets/music/<id>.mp3`.
- Background music is third-party no-copyright material sourced from YouTube; it is not covered by the project's MIT licence. Do not describe it as original/MIT in docs.
- `drift` is a hidden fifth mode (`13×13`, 6 tries) and is intentionally not in `MODE_ORDER`. It unlocks permanently when all four normal modes have `best <= 4`; the menu shows a locked `???` card until then. After the first guess, every miss teleports the target to a cell that is neither guessed nor orthogonally adjacent to any guessed cell, and never the previous target cell. Keep the target move invisible; the guessed cell still gets the normal click/reveal VFX.
