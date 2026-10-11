# convert-extract

A small desktop app for running your own JavaScript string utilities. Each tab has an input area, an output area, a dropdown to pick a utility, and an Execute button. Frequently used string → string utilities also get a one-line row each on the **Quick** tab.

Built with [Tauri 2](https://tauri.app) and a vanilla JavaScript + [Vite](https://vite.dev) frontend. No framework, no custom Rust.

## Using the app

- **Quick tab** — one row per utility marked `quick: true`, grouped under a collapsible heading per category. Type or paste into the input, press ▶ (or Ctrl+Enter), read the output. Each row has Copy and Clear.
- **Regular tabs** — press **+** for a new tab. Pick a utility from the dropdown (grouped by category), paste into the input, press **Execute** or Ctrl+Enter. The tab takes the utility's name as its title.
  - **Copy**, in the Output area's header, puts the output on the clipboard. **Clear** empties both areas. **Send to new tab** opens a fresh tab seeded with the current output, for chaining utilities.
  - **Side by side / Stacked** switches that tab between a vertical and a horizontal layout.
  - **Wrap** on each area toggles soft wrapping. Off by default.
  - **Split lines** appears only for utilities that accept both forms of input. Ticked, the input is split one line per array element; unticked, the text goes through whole (use this for pasted JSON you want kept intact).
- **Composer tab** — build named **sequences**: an ordered list of utilities where each step's output feeds the next. Give it a name, add steps (the Split lines box appears for utilities that accept both forms), tick Quick if you want a row for it, use Try it to run the chain on sample input, then Save. Saved sequences appear under a `sequence` group in every tab's dropdown and, when Quick, on the Quick tab; they run and log like any utility. Edit reloads one into the editor, Delete asks for a second click. Sequences are kept in the app's local storage, so they survive restarts on this machine; steps may not be other sequences.
- **Log** at the right of the tab bar opens a drawer listing every Quick run this session: local timestamp, `category:name`, input, output, tab-separated and one line each (line breaks inside values are written as `\n`; failed runs show `ERROR: message`). Select any part of it, or use Copy for the whole log and Clear to empty it. The log is not kept between launches.
- **☾ / ☀** at the right of the tab bar switches between light and dark mode. The first launch follows your system setting; after that your choice is remembered.
- Window size and position are restored on relaunch. Tab contents are not; every launch starts fresh.

## Adding a utility

Four steps per utility. Nothing else in the app needs touching.

### 1. Drop the file in `src/utilities/`

Use a kebab-case file name, for example `trim-lines.js`. Start from `src/utilities/_template.js`, or paste an existing function in. The file must export the function and a `meta` object:

```js
export function trimLines(lines) {
  return lines.map((l) => l.trim());
}

export const meta = {
  name: 'trim lines',            // dropdown, tab title, Quick row
  description: 'Trim each line', // 25 characters max
  category: 'text',              // free string; dropdown groups by it
  fn: trimLines,
  inputType: 'lines',            // 'string' | 'lines' | 'both'
  resultType: 'lines',           // 'string' | 'lines'
  quick: false,                  // true puts it on the Quick tab; needs string → string
  // quickPlaceholder: 'a, b, c', // optional: hint shown in the empty Quick input
  // sortOrder: 0,                // optional: rank within the category, ahead of the alphabetical rest
};

export default trimLines;
```

`inputType` and `resultType` tell the app how to feed your function:

| Value | Input handed to `fn` | Result expected back |
|---|---|---|
| `string` | the textarea text as one string | one string |
| `lines` | the text split on line breaks, one element per line | an array of strings, joined with `\n` |
| `both` | either, chosen per run with the **Split lines** checkbox | per `resultType` |

Keep utilities synchronous and pure. Throw an `Error` with a readable message when input is bad; the app shows it in red in the output area.

### 2. Register it in `src/registry.js`

One import line and one entry in the `modules` object, keyed by the file name:

```js
import * as trimLines from './utilities/trim-lines.js';

const modules = {
  'hexdump-extract-text.js': hexdumpExtractText,
  'trim-lines.js': trimLines,
};
```

The registry validates every `meta` at startup and names the file in the error, so a typo in `inputType`, a duplicate name, or a description over 25 characters shows up immediately rather than silently.

### 3. Add a test under `tests/utilities/`

Name it to match the utility, here `tests/utilities/trim-lines.test.js`. Use `tests/utilities/hexdump-extract-text.test.js` as a model: a `describe` block with one case per behaviour, plus a check on `meta`.

The coverage gate is 100% lines, branches, functions and statements, so every branch in your function needs a case. Run:

```sh
pnpm coverage
```

### 4. Rebuild and run

```sh
pnpm tauri dev                 # live-reloading window while you work
pnpm tauri build --no-bundle   # refresh src-tauri/target/release/convert-extract.exe
pnpm tauri build               # also produce the MSI and NSIS installers under src-tauri/target/release/bundle/
```

Utilities are listed by category, then by `sortOrder` for those that set one (lowest first), then by name. The Quick tab shows one collapsible group per category and the dropdown one option group. Choose categories deliberately as the collection grows. Categories in use: `data`, `date`, `hex`, `text`, `timestamp`, `web`.

Code shared by several utilities lives in `src/lib/`, not in `src/utilities/`, so the registry never mistakes it for a utility. The timestamp utilities are an example: each is a few lines over `src/lib/timestamp.js`.

## Development

Requirements: Node 24+, pnpm 10+, Rust stable, and the Tauri prerequisites for your platform (WebView2 on Windows, which Windows 11 already has).

```sh
pnpm install
pnpm test        # run the test suite once
pnpm coverage    # tests plus the 100% coverage gate
pnpm dev         # frontend only, in a browser at http://localhost:5173
pnpm tauri dev   # frontend inside the Tauri window
```

Tests are written before code, and the coverage thresholds in `vite.config.js` are the gate for "done".

### Layout

```
src/
  main.js              boots the tab bar, Quick tab, first regular tab, theme toggle
  registry.js          lists every utility and validates its meta
  style.css            colour variables for light and dark, all layout
  utilities/           one ES module per utility, plus _template.js
  lib/                 code shared by several utilities
  sequences/
    store.js           saved sequences: validation, localStorage persistence
    compose.js         a sequence as a runnable meta (the step-by-step fold)
    catalogue.js       static utilities + sequences, with change events
  ui/
    tabs.js            tab bar and panel switching
    tab-panel.js       a regular tab: toolbar, input, output
    quick-panel.js     the Quick tab rows
    composer-panel.js  the Composer tab
    quick-log.js       in-memory log of Quick runs
    log-drawer.js      the log viewer drawer
    feedback.js        pressed-state flash for buttons
    run.js             feeds a utility according to inputType/resultType
    clipboard.js       Copy with status feedback
    theme.js           light/dark toggle
tests/                 mirrors src/; UI tests run under jsdom
src-tauri/             Tauri shell: config, capabilities, window-state plugin
docs/superpowers/      design spec and implementation plan
```

### Not yet

- `meta.args`: per-utility arguments with a small UI. Deferred.
- Async utilities.
- Persisting tab contents between launches.

## Known limitation

In `hexdump → text`, a gutter-less dump whose offsets have no colon, such as `0000  41 42 43`, is all hex characters, so it is treated as bare hex and the offset is decoded as data. Dumps with an ASCII gutter, or xxd-style `0000:` offsets, decode correctly.
