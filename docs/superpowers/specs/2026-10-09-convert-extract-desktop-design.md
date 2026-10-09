# convert-extract desktop app: design

Date: 2026-10-09

## Purpose

A tabbed desktop app for running a growing collection of small JavaScript text utilities. Each utility takes a string or an array of strings and returns a string or an array of strings. The user pastes text into an input area, picks a utility, presses Execute, and reads the result in an output area. Frequently used string-to-string utilities also appear as single rows on a "Quick" tab.

## Decisions made

| Topic | Decision |
|---|---|
| Shell | Tauri 2, Windows target. No custom Rust code. |
| Frontend | Vanilla JS ES modules, bundled by Vite. No framework. |
| Utilities | One ES module per utility under `src/utilities/`. Each exports its function and a `meta` object. |
| Registry | `src/registry.js` imports every utility module (one line each) and exports the validated, sorted list. |
| Quick tab | First tab, not closable. One row per utility with `meta.quick === true`. Row layout: name, input, run button, output, Copy. |
| Regular tab | Toolbar on top, input area above output area (stacked). Per-tab toggle switches to side by side. |
| Word wrap | Per text area checkbox, off by default. |
| Arrays | One line = one element. Utilities declaring `inputType: 'both'` get a per-tab "Split lines" checkbox, off by default. |
| Persistence | Tabs and text start fresh every launch. Window size and position are remembered. |
| Extras | Ctrl+Enter runs Execute. Copy output button. Send output to new tab button. |

## Project layout

```
convert-extract/
  package.json
  vite.config.js
  index.html
  src-tauri/                 generated Tauri 2 scaffold; window-state plugin enabled
  src/
    main.js                  boots the app: Quick tab plus one empty regular tab
    registry.js              imports utilities, validates meta, exports sorted list
    ui/
      tabs.js                tab bar: add, close, switch, title
      tab-panel.js           one regular tab: toolbar, input, output, toggles
      quick-panel.js         the Quick tab: one row per quick utility
      run.js                 shared execute: split/join, error capture
    utilities/
      hexdump-extract-text.js   moved from repo root
      ...                       one file per utility
  tests/
    run.test.js
    registry.test.js
    utilities/<name>.test.js
  docs/superpowers/specs/
```

Utility files import nothing from the app, so they still run under Node.

## Registry contract

Each utility module exports its function and a `meta` object:

```js
export const meta = {
  name: 'hexdump → text',        // shown in dropdown, tab title, Quick row
  description: 'Decode hex dumps',  // max 25 characters
  category: 'hex',               // free string; dropdown groups by it
  fn: hexdumpExtractText,
  inputType: 'string',           // 'string' | 'lines' | 'both'
  resultType: 'string',          // 'string' | 'lines'
  quick: true,                   // appears on the Quick tab
  // args: [...]                 // reserved for a later version
};
```

`registry.js` validates every entry at startup and throws with the file name on the first violation:

- `name`, `description`, `category` are non-empty strings; `description` is at most 25 characters.
- `fn` is a function.
- `inputType` is one of `string`, `lines`, `both`; `resultType` is one of `string`, `lines`.
- `quick` is a boolean. If true, `inputType` must be `string` and `resultType` must be `string`.
- `name` is unique across the registry.

The exported list is sorted by `category`, then `name`. The utility dropdown renders one `<optgroup>` per category.

## Input and output mapping

`run.js` exposes one function: `execute(meta, text, { splitLines })` returning `{ ok: true, output }` or `{ ok: false, error }`.

- `inputType: 'string'`: `text` is passed unchanged.
- `inputType: 'lines'`: `text.split(/\r?\n/)` is passed.
- `inputType: 'both'`: split when `splitLines` is true, otherwise passed unchanged.
- `resultType: 'lines'`: the returned array is joined with `\n`.
- `resultType: 'string'`: the returned string is used exactly, nothing appended.
- A result that is not a string (for `string`) or not an array of strings (for `lines`) is reported as an error.
- Any thrown error is caught; `error` is its message.

Pasted multi-line JSON therefore reaches a `string` utility untouched.

## UI behavior

### Tab bar

- The first tab is "Quick". It has no close button.
- A "+" button opens a new empty regular tab and switches to it.
- Each regular tab's title is its selected utility's name, or "Untitled" when none is selected. Each has a close button. Closing the active tab activates its left neighbour.
- Startup state: Quick tab plus one empty regular tab, with the regular tab active.

### Regular tab

Toolbar, left to right:

1. Utility dropdown, grouped by category, with a blank first entry.
2. Execute button.
3. Copy output button.
4. Clear button: empties both areas.
5. Send output to new tab button: opens a new regular tab with the current output as its input and no utility selected.
6. Layout toggle: stacked (default) or side by side.
7. "Split lines" checkbox, shown only when the selected utility declares `inputType: 'both'`, off by default.
8. Status text: the selected utility's description and `inputType → resultType`.

Body: two monospace textareas labelled Input and Output. Output is read-only. Each has a "Wrap" checkbox, off by default (textarea `wrap="off"`). Ctrl+Enter with focus in the input runs Execute.

On Execute: if no utility is selected, the output shows "Select a utility" and nothing else happens. Otherwise `run.execute` is called. On success the output is replaced. On error the output area shows the error message and gains a red border until the next successful run or Clear.

### Quick tab

One row per `quick` utility, in registry order. Each row holds: the utility name (tooltip shows the description), an input textarea, a run button, a read-only output textarea, and a Copy button. Textareas start at one line and grow to at most four lines as content is pasted; beyond that they scroll. Word wrap is off. Ctrl+Enter in a row's input runs that row. Errors render in the row's output with a red border, the same as a regular tab.

## Error handling

- Utility exceptions never escape to the console or crash the page; they surface in the output area.
- Registry validation failures throw at startup so a bad `meta` is caught the first time the dev server loads.
- Clipboard failures (Copy) are shown briefly in the status text.

## Testing

- Vitest, run with `pnpm test`.
- `tests/run.test.js`: every branch of the input and output mapping, including error capture and the non-string result case.
- `tests/registry.test.js`: each validation rule rejects a bad entry; a good set sorts by category then name.
- `tests/utilities/hexdump-extract-text.test.js`: the three input forms (dump, bare hex, dotted), UTF-16LE and UTF-8 detection, and the odd-hex-length error.
- Each new utility ships with a test file alongside.
- UI is checked manually through `pnpm tauri dev`.

## Build and run

- `pnpm install`, then `pnpm tauri dev` for the dev loop with Vite hot reload.
- `pnpm tauri build` produces the Windows installer and executable.
- Toolchain present on the machine: Rust 1.97, Node 24, pnpm 10.

## Out of scope for this version

- Utility arguments (`meta.args`) and any UI for them.
- Persisting tab contents between launches.
- Asynchronous utilities.
- Any Rust-side logic.
