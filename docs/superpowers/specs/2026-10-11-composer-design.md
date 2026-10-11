# Composer: named sequences of utilities

Date: 2026-10-11. Status: approved in conversation (Composer tab chosen).

## What

A **sequence** is a name plus an ordered list of steps. Each step names one
utility (by its file key, e.g. `trim-end.js`) and, for utilities whose
`inputType` is `both`, whether to split lines for that step. Running a
sequence feeds the input text to step 1, step 1's output text to step 2, and
so on; the last step's output is the sequence's output.

A sequence looks like a utility to the rest of the app: category `sequence`,
`string → string`, optionally `quick`. It appears in every tab's dropdown and,
when quick, on the Quick tab, and its runs are logged like any other.

The **Composer** is a non-closable tab, after Quick, where sequences are
created, edited, tested and deleted.

## Model

```js
{ name: 'Tidy list', quick: true, steps: [
  { utility: 'trim-end.js' },
  { utility: 'trim-ending-comma.js' },
  { utility: 'remove-line-breaks.js' },
] }
```

Rules, enforced on save with a message shown in the Composer:
- name is non-empty after trimming and unique among sequences (case-sensitive);
- at least one step; every step's `utility` is a registered file key;
- steps may not be sequences (no nesting, so no cycles).

Persistence: the array of sequences is stored as JSON in `localStorage`
under the key `sequences`. Unreadable or malformed storage is treated as
empty. Tauri's WebView2 keeps `localStorage` per app, so sequences survive
restarts. File export/import is a later feature.

## Running

`composeSequence(seq, utilitiesByFile)` returns a meta object whose `fn(text)`
runs `execute(meta, text, { splitLines })` per step. A failing step throws
`Step N (utility name): message`, which the tab or Quick row shows in red as
usual. `description` is `N steps`.

## Catalogue

`createCatalogue({ utilities, utilitiesByFile, store })` merges the static
registry with the composed sequences and exposes `all()`, `quick()` and
`onChange(fn)`. Ordering follows the registry's rule (category, sortOrder,
name), so sequences form their own group.

On change, main.js re-renders the Quick tab's rows and refreshes the
dropdown of every open regular tab, preserving each tab's current selection
(a tab whose selected sequence was deleted falls back to none).

## Composer tab layout

Two columns.

Left, **Saved**: one row per sequence (name, step count, Quick marker) with
Edit and Delete. Delete asks for confirmation in place (the button becomes
"Confirm?" for a moment) because there is no undo.

Right, **Editor**:
- Name field, Quick checkbox.
- Steps list. Each step row: a select of utilities grouped by category
  (sequences excluded), a Split lines checkbox shown only when the chosen
  utility's inputType is `both`, Up, Down and Remove buttons.
- "+ Add step".
- Try it: an input textarea, a Run button (Ctrl+Enter works), an output
  textarea. Runs the editor's current steps without saving.
- Save and New. Save validates, stores, and shows "Saved" in the status;
  editing an existing sequence and renaming it replaces the old entry.

## Not in this version

- Nesting sequences in sequences.
- Per-step arguments (waits for meta.args).
- File export/import; sharing between machines.
- Reordering by drag; Up/Down buttons are enough.

## Files

- `src/sequences/store.js` — validation and localStorage persistence.
- `src/sequences/compose.js` — sequence → meta with the fold.
- `src/sequences/catalogue.js` — static utilities + sequences, change events.
- `src/ui/composer-panel.js` — the Composer tab.
- `src/registry.js` — also exports `utilitiesByFile` and `compare`.
- `src/ui/quick-panel.js` — gains `setUtilities(list)`.
- `src/ui/tab-panel.js` — gains `refreshUtilities(list)`.
- `src/main.js` — wiring.
- Tests mirror each file; main.test covers the boot wiring.
