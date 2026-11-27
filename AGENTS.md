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
- `drift` is a hidden fifth mode (`13×13`, 10 tries, 90 seconds) and is intentionally not in `MODE_ORDER`. It unlocks permanently when all four normal modes have `best <= 4`; the menu shows a locked `???` card until then. A one-time typewriter story introduces the ghost; retries show a short card. Both wait for a click/key before the clock starts. The ghost moves on its own 5–10s uniform timer, independent of guesses: it never lands on a guessed cell or orthogonally beside one, never the previous cell, and prefers a destination that changes every displayed distance. Every move repaints all revealed cells and log rows to the new distance, with a number pop/flash; the move itself stays invisible. The HUD shows a 90s segmented clock and a drift telegraph whose cell count matches the current 5–10s interval, with a seconds countdown (last two cells and the countdown turn red in the final 3s). Time-up or 10 tries ends the run. The clock pauses when the tab is hidden or the audio dialog is open. A drift due during the reveal lock waits for the lock. Keep `0` as the win reading; the three-corner solve still works between moves.
