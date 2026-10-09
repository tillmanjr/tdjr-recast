# convert-extract Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Tauri 2 desktop app with a tab bar, a Quick tab of one-row string utilities, and regular tabs that run any registered utility on pasted text.

**Architecture:** Vanilla JS ES modules bundled by Vite inside a Tauri 2 window; no custom Rust. Utilities are standalone modules under `src/utilities/`, each exporting a function plus a `meta` object, collected by `src/registry.js`. A single `execute()` in `src/ui/run.js` maps textarea text to the utility's declared input type and back.

**Tech Stack:** Tauri 2 (`@tauri-apps/cli` 2.12.1, `tauri-plugin-window-state`), Vite 8.3.4, Vitest 5.0.3, pnpm 10, Rust 1.97, Node 24. Windows 11 target.

Spec: `docs/superpowers/specs/2026-10-09-convert-extract-desktop-design.md`

## Global Constraints

- Utilities live flat in `src/utilities/`, kebab-case file names, camelCase function names, mirrored test file in `tests/utilities/`.
- Utility modules import nothing from `src/ui`, `src/registry.js`, or `src/main.js`. No npm dependencies. Synchronous. Run in browser and Node.
- `meta` fields: `name`, `description` (max 25 chars), `category`, `fn`, `inputType` (`string` | `lines` | `both`), `resultType` (`string` | `lines`), `quick` (boolean). `quick: true` requires `string → string`.
- Arrays map to lines: split on `/\r?\n/`, join with `\n`. String results are never altered; nothing is appended.
- Word wrap off by default on every textarea. Regular tab layout defaults to stacked.
- Tabs start fresh every launch. Only window size and position persist.
- Commit after every task. Run `pnpm test` before every commit.
- All shell commands below are run from the repo root `F:\Sync\Xenomorph9\code\utilities\convert-extract` unless stated.

---

## File map

| Path | Responsibility |
|---|---|
| `package.json` | scripts and dev dependencies |
| `vite.config.js` | Vite dev server on port 5173, Vitest config |
| `index.html` | page shell: `#app` div, loads `src/main.js` and `src/style.css` |
| `src/style.css` | all styling |
| `src/main.js` | boot: build tab bar, Quick tab, first empty tab, wire "+" |
| `src/registry.js` | imports every utility, validates `meta`, exports sorted lists |
| `src/ui/run.js` | `execute(meta, text, opts)`: input/output mapping and error capture |
| `src/ui/clipboard.js` | `copyText(text, statusEl)` with a transient status message |
| `src/ui/tabs.js` | `createTabBar(root)`: add, close, activate, setTitle |
| `src/ui/tab-panel.js` | `createTabPanel(opts)`: one regular tab |
| `src/ui/quick-panel.js` | `createQuickPanel(opts)`: the Quick tab |
| `src/utilities/_template.js` | starting point for new utilities; not registered |
| `src/utilities/hexdump-extract-text.js` | moved from repo root, gains `meta` |
| `src-tauri/` | generated Tauri scaffold with window-state plugin |
| `tests/run.test.js`, `tests/registry.test.js`, `tests/utilities/hexdump-extract-text.test.js` | Vitest suites |

---

### Task 1: Project scaffold (Vite, Vitest, Tauri, window-state)

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/style.css`
- Create (generated): `src-tauri/**`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `pnpm dev` (Vite on http://localhost:5173), `pnpm test` (Vitest, `tests/**/*.test.js`), `pnpm tauri dev`, `pnpm tauri build`.

- [x] **Step 1: Create `package.json`**

```json
{
  "name": "convert-extract",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "coverage": "vitest run --coverage",
    "tauri": "tauri"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.12.1",
    "@vitest/coverage-v8": "5.0.3",
    "jsdom": "^30.1.2",
    "vite": "^8.3.4",
    "vitest": "^5.0.3"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.12.2"
  }
}
```

- [x] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  build: { target: 'esnext' },
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/main.js', 'src/utilities/_template.js'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
```

UI test files opt into the DOM with a `// @vitest-environment jsdom` comment on their first line; everything else runs in Node. `src/main.js` is excluded from coverage because it only wires modules together at load time; `_template.js` is a copy source, not code.

- [x] **Step 3: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>convert-extract</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [x] **Step 4: Create placeholder `src/main.js` and `src/style.css`**

`src/main.js`:
```js
document.getElementById('app').textContent = 'convert-extract';
```

`src/style.css`:
```css
:root { font-family: system-ui, sans-serif; font-size: 13px; color: #223; background: #f0f1f5; }
html, body, #app { height: 100%; margin: 0; }
```

- [x] **Step 5: Install and verify Vite + Vitest**

Run: `pnpm install`
Expected: lockfile written, no peer-dependency errors. (If pnpm reports a Vite/Vitest peer mismatch, pin `vitest` to the newest version whose peer range includes Vite 8 and re-run.)

Run: `pnpm build`
Expected: `dist/index.html` produced, "✓ built in" line.

Run: `pnpm exec vitest run --passWithNoTests`
Expected: "No test files found" and exit code 0.

- [x] **Step 6: Initialize Tauri non-interactively**

Run:
```powershell
pnpm tauri init --ci -A convert-extract -W convert-extract -D ../dist -P http://localhost:5173 --before-dev-command "pnpm dev" --before-build-command "pnpm build"
```
Expected: `src-tauri/` created with `Cargo.toml`, `tauri.conf.json`, `src/main.rs`, `src/lib.rs`, `capabilities/default.json`.

- [x] **Step 7: Set identifier and window size in `src-tauri/tauri.conf.json`**

Open the file and set these keys (keep everything else the generator wrote):

```json
"identifier": "dev.xenomorph9.convert-extract",
```
and inside `app.windows[0]`:
```json
"title": "convert-extract",
"width": 1100,
"height": 750
```

- [x] **Step 8: Add the window-state plugin**

Run: `pnpm tauri add window-state`
Expected: `src-tauri/Cargo.toml` gains `tauri-plugin-window-state`, `src-tauri/src/lib.rs` gains `.plugin(tauri_plugin_window_state::Builder::default().build())`, `src-tauri/capabilities/default.json` gains `"window-state:default"`, and `package.json` gains `@tauri-apps/plugin-window-state`.

Verify: `grep -n window_state src-tauri/src/lib.rs` prints the plugin line. If the capability line is missing, add `"window-state:default"` to the `permissions` array in `src-tauri/capabilities/default.json`.

- [x] **Step 9: Compile the Rust side once**

Run (first run downloads crates, allow 10 minutes):
```powershell
cd src-tauri; cargo check; cd ..
```
Expected: ends with `Finished` and no errors.

- [x] **Step 10: Extend `.gitignore`**

Append to `.gitignore`:
```
src-tauri/gen/schemas/
```

- [x] **Step 11: Commit**

```powershell
git add -A
git commit -m "Scaffold Vite, Vitest and Tauri 2 with window-state plugin"
```

---

### Task 2: `execute()` input/output mapping

**Files:**
- Create: `src/ui/run.js`
- Test: `tests/run.test.js`

**Interfaces:**
- Produces: `execute(meta, text, { splitLines = false } = {}) → { ok: true, output: string } | { ok: false, error: string }`. `meta` needs `name`, `fn`, `inputType`, `resultType`.

- [x] **Step 1: Write the failing tests**

`tests/run.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { execute } from '../src/ui/run.js';

const meta = (over) => ({ name: 'u', fn: (x) => x, inputType: 'string', resultType: 'string', ...over });

describe('execute input mapping', () => {
  it('passes the whole text unchanged for inputType string', () => {
    const fn = vi.fn((x) => x);
    const text = '{\n  "a": 1\n}\n';
    execute(meta({ fn }), text);
    expect(fn).toHaveBeenCalledWith(text);
  });

  it('splits on \\n and \\r\\n for inputType lines', () => {
    const fn = vi.fn((lines) => lines);
    execute(meta({ fn, inputType: 'lines', resultType: 'lines' }), 'a\nb\r\nc');
    expect(fn).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('for inputType both passes text unchanged unless splitLines is set', () => {
    const fn = vi.fn((x) => (Array.isArray(x) ? x.join('|') : x));
    expect(execute(meta({ fn, inputType: 'both' }), 'a\nb').output).toBe('a\nb');
    expect(execute(meta({ fn, inputType: 'both' }), 'a\nb', { splitLines: true }).output).toBe('a|b');
  });
});

describe('execute output mapping', () => {
  it('joins a lines result with \\n', () => {
    const res = execute(meta({ fn: () => ['x', 'y'], resultType: 'lines' }), '');
    expect(res).toEqual({ ok: true, output: 'x\ny' });
  });

  it('returns a string result exactly, appending nothing', () => {
    const res = execute(meta({ fn: () => 'abc' }), '');
    expect(res).toEqual({ ok: true, output: 'abc' });
  });

  it('reports a thrown error by message', () => {
    const res = execute(meta({ fn: () => { throw new Error('Odd hex length (3)'); } }), 'abc');
    expect(res).toEqual({ ok: false, error: 'Odd hex length (3)' });
  });

  it('reports a non-string result when string was declared', () => {
    const res = execute(meta({ fn: () => 42 }), '');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/declared string result but returned a number/);
  });

  it('reports a non-array result when lines was declared', () => {
    const res = execute(meta({ fn: () => 'nope', resultType: 'lines' }), '');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/declared lines result but returned a string/);
  });

  it('reports an array with non-string items when lines was declared', () => {
    const res = execute(meta({ fn: () => ['a', 1], resultType: 'lines' }), '');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/array with non-string items/);
  });

  it('describes an array of strings returned where a string was declared', () => {
    const res = execute(meta({ fn: () => ['a'] }), '');
    expect(res.error).toMatch(/returned an array of strings/);
  });

  it('describes a null result', () => {
    const res = execute(meta({ fn: () => null }), '');
    expect(res.error).toMatch(/returned null/);
  });

  it('stringifies a thrown non-Error value', () => {
    const res = execute(meta({ fn: () => { throw 'boom'; } }), '');
    expect(res).toEqual({ ok: false, error: 'boom' });
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, "Failed to resolve import ../src/ui/run.js" or similar module-not-found error.

- [x] **Step 3: Implement `src/ui/run.js`**

```js
/**
 * Run one utility on textarea text, mapping text to the utility's declared
 * input type and the result back to text. Never throws.
 *
 * @param {{name:string, fn:Function, inputType:string, resultType:string}} meta
 * @param {string} text
 * @param {{splitLines?: boolean}} [opts]
 * @returns {{ok:true, output:string} | {ok:false, error:string}}
 */
export function execute(meta, text, { splitLines = false } = {}) {
  const split = meta.inputType === 'lines' || (meta.inputType === 'both' && splitLines);
  const input = split ? text.split(/\r?\n/) : text;

  let result;
  try {
    result = meta.fn(input);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (meta.resultType === 'lines') {
    if (!Array.isArray(result) || !result.every((s) => typeof s === 'string')) {
      return { ok: false, error: `${meta.name} declared lines result but returned ${describe(result)}` };
    }
    return { ok: true, output: result.join('\n') };
  }

  if (typeof result !== 'string') {
    return { ok: false, error: `${meta.name} declared string result but returned ${describe(result)}` };
  }
  return { ok: true, output: result };
}

function describe(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) {
    return v.every((s) => typeof s === 'string') ? 'an array of strings' : 'an array with non-string items';
  }
  return `a ${typeof v}`;
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: `tests/run.test.js` 12 passed.

- [x] **Step 5: Commit**

```powershell
git add src/ui/run.js tests/run.test.js
git commit -m "Add execute(): map textarea text to utility input and back"
```

---

### Task 3: Utility template and the hexdump utility with `meta`

**Files:**
- Create: `src/utilities/_template.js`
- Move: `hexdump-extract-text.js` → `src/utilities/hexdump-extract-text.js` (then modify)
- Test: `tests/utilities/hexdump-extract-text.test.js`

**Interfaces:**
- Produces: `src/utilities/hexdump-extract-text.js` exporting `hexdumpExtractText(input, { encoding })` and `meta` (name `'hexdump → text'`, category `'hex'`, `string → string`, `quick: true`).

- [x] **Step 1: Write the failing utility tests**

`tests/utilities/hexdump-extract-text.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { hexdumpExtractText, meta } from '../../src/utilities/hexdump-extract-text.js';

describe('hexdumpExtractText', () => {
  it('decodes a hex-viewer dump row from the hex column, not the gutter', () => {
    const dump = '0000  7b 00 22 00 6d 00 73 00 67 00 73 00 22 00 3a 00  {.".m.s.g.s.".:.';
    expect(hexdumpExtractText(dump)).toBe('{"msgs":');
  });

  it('decodes bare UTF-16LE hex', () => {
    expect(hexdumpExtractText('7b0022006d0073006700730022003a00')).toBe('{"msgs":');
  });

  it('decodes bare UTF-8 hex when there are no zero bytes', () => {
    expect(hexdumpExtractText('68656c6c6f')).toBe('hello');
  });

  it('inlines non-printable code points as <0xNN>', () => {
    expect(hexdumpExtractText('680a')).toBe('h<0x0A>');
  });

  it('decodes dot-interleaved gutter text', () => {
    expect(hexdumpExtractText('{.".m.s.g.s.".:.')).toBe('{"msgs":');
  });

  it('throws on odd hex length', () => {
    expect(() => hexdumpExtractText('abc')).toThrow('Odd hex length (3)');
  });
});

describe('meta', () => {
  it('declares a quick string → string utility', () => {
    expect(meta).toMatchObject({
      name: 'hexdump → text',
      category: 'hex',
      inputType: 'string',
      resultType: 'string',
      quick: true,
    });
    expect(meta.fn).toBe(hexdumpExtractText);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, cannot resolve `../../src/utilities/hexdump-extract-text.js`.

- [x] **Step 3: Move the utility and add `meta`**

Run: `git mv hexdump-extract-text.js src/utilities/hexdump-extract-text.js`

Then in `src/utilities/hexdump-extract-text.js`, replace the block from `export function hexdumpExtractText` through the end of the file with:

```js
export function hexdumpExtractText(input, { encoding = 'auto' } = {}) {
  const trimmed = input.trim();
  if (/^[0-9a-fA-F\s]+$/.test(trimmed)) return decodeBytes(hexToBytes(trimmed), encoding);
  if (isDump(trimmed.split(/\r?\n/))) return decodeBytes(dumpToBytes(trimmed), encoding);
  return decodeDotted(trimmed);
}

export const meta = {
  name: 'hexdump → text',
  description: 'Decode hex dumps to text',
  category: 'hex',
  fn: hexdumpExtractText,
  inputType: 'string',
  resultType: 'string',
  quick: true,
};

export default hexdumpExtractText;
```

(The commented-out CLI block at the bottom of the original file is removed; the utility must stay free of Node-only code.)

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: `tests/utilities/hexdump-extract-text.test.js` 7 passed, `tests/run.test.js` 9 passed.

- [x] **Step 5: Create `src/utilities/_template.js`**

```js
/**
 * <Utility name> — <one line: what it does>.
 *
 * Accepts: <input forms, e.g. "a single string" or "one item per line">
 * Returns: <what comes back>
 *
 * Copy this file to src/utilities/<kebab-name>.js, rename the function to
 * the camelCase form of the file name, fill in meta, then add one import
 * line to src/registry.js and a test under tests/utilities/.
 */

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function myUtility(input, {} = {}) {
  return input;
}

export const meta = {
  name: 'my utility',          // shown in dropdown, tab title, Quick row
  description: 'What it does', // max 25 characters
  category: 'text',            // free string; dropdown groups by it
  fn: myUtility,
  inputType: 'string',         // 'string' | 'lines' | 'both'
  resultType: 'string',        // 'string' | 'lines'
  quick: false,                // true puts it on the Quick tab (string → string only)
};

export default myUtility;
```

- [x] **Step 6: Commit**

```powershell
git add -A
git commit -m "Move hexdump utility under src/utilities with meta; add utility template"
```

---

### Task 4: Registry with validation

**Files:**
- Create: `src/registry.js`
- Test: `tests/registry.test.js`

**Interfaces:**
- Consumes: `src/utilities/hexdump-extract-text.js` `meta`.
- Produces: `validate(meta, file)` (throws `Error` naming the file), `buildRegistry({ [file]: module })` (returns sorted `meta[]`), `utilities` (sorted list), `quickUtilities` (those with `quick: true`), constants `INPUT_TYPES`, `RESULT_TYPES`, `DESCRIPTION_MAX`.

- [x] **Step 1: Write the failing tests**

`tests/registry.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { validate, buildRegistry, utilities, quickUtilities, DESCRIPTION_MAX } from '../src/registry.js';

const good = () => ({
  name: 'upper', description: 'Uppercase', category: 'text',
  fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true,
});

describe('validate', () => {
  it('accepts a complete meta and returns it', () => {
    const m = good();
    expect(validate(m, 'upper.js')).toBe(m);
  });

  it.each([
    ['name', ''], ['description', ''], ['category', ' '],
  ])('rejects empty %s', (key, value) => {
    expect(() => validate({ ...good(), [key]: value }, 'f.js')).toThrow(`Utility f.js: meta.${key} must be a non-empty string`);
  });

  it('rejects a description longer than DESCRIPTION_MAX', () => {
    const description = 'x'.repeat(DESCRIPTION_MAX + 1);
    expect(() => validate({ ...good(), description }, 'f.js')).toThrow(/description is 26 chars, max 25/);
  });

  it('rejects a non-function fn', () => {
    expect(() => validate({ ...good(), fn: 'nope' }, 'f.js')).toThrow(/meta.fn must be a function/);
  });

  it('rejects unknown inputType and resultType', () => {
    expect(() => validate({ ...good(), inputType: 'array' }, 'f.js')).toThrow(/meta.inputType must be one of string, lines, both/);
    expect(() => validate({ ...good(), resultType: 'both' }, 'f.js')).toThrow(/meta.resultType must be one of string, lines/);
  });

  it('rejects a non-boolean quick', () => {
    expect(() => validate({ ...good(), quick: 'yes' }, 'f.js')).toThrow(/meta.quick must be a boolean/);
  });

  it('rejects quick utilities that are not string → string', () => {
    expect(() => validate({ ...good(), inputType: 'lines' }, 'f.js')).toThrow(/quick utilities must be string → string/);
    expect(() => validate({ ...good(), resultType: 'lines' }, 'f.js')).toThrow(/quick utilities must be string → string/);
  });

  it('rejects a module with no meta export', () => {
    expect(() => validate(undefined, 'f.js')).toThrow('Utility f.js: has no meta export');
    expect(() => validate('not an object', 'f.js')).toThrow('Utility f.js: has no meta export');
  });

  it('rejects a non-string name', () => {
    expect(() => validate({ ...good(), name: 42 }, 'f.js')).toThrow(/meta.name must be a non-empty string/);
  });
});

describe('buildRegistry', () => {
  it('sorts by category then name', () => {
    const reg = buildRegistry({
      'c.js': { meta: { ...good(), name: 'zeta', category: 'hex' } },
      'a.js': { meta: { ...good(), name: 'beta', category: 'text' } },
      'b.js': { meta: { ...good(), name: 'alpha', category: 'text' } },
    });
    expect(reg.map((m) => m.name)).toEqual(['zeta', 'alpha', 'beta']);
  });

  it('rejects duplicate names, naming the second file', () => {
    expect(() => buildRegistry({
      'a.js': { meta: good() },
      'b.js': { meta: good() },
    })).toThrow('Utility b.js: duplicate name "upper"');
  });

  it('rejects a module value that is not an object', () => {
    expect(() => buildRegistry({ 'a.js': undefined })).toThrow('Utility a.js: has no meta export');
  });
});

describe('real registry', () => {
  it('contains the hexdump utility and lists it as quick', () => {
    expect(utilities.some((u) => u.name === 'hexdump → text')).toBe(true);
    expect(quickUtilities.map((u) => u.name)).toContain('hexdump → text');
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, cannot resolve `../src/registry.js`.

- [x] **Step 3: Implement `src/registry.js`**

```js
/**
 * Every utility the app knows about. To add one: import its module below and
 * add it to `modules` keyed by file name. The key appears in error messages.
 */
import * as hexdumpExtractText from './utilities/hexdump-extract-text.js';

const modules = {
  'hexdump-extract-text.js': hexdumpExtractText,
};

export const INPUT_TYPES = ['string', 'lines', 'both'];
export const RESULT_TYPES = ['string', 'lines'];
export const DESCRIPTION_MAX = 25;

/** Throws a descriptive Error if `meta` breaks the registry contract. Returns `meta`. */
export function validate(meta, file) {
  const fail = (msg) => { throw new Error(`Utility ${file}: ${msg}`); };
  if (!meta || typeof meta !== 'object') fail('has no meta export');
  for (const key of ['name', 'description', 'category']) {
    if (typeof meta[key] !== 'string' || meta[key].trim() === '') fail(`meta.${key} must be a non-empty string`);
  }
  if (meta.description.length > DESCRIPTION_MAX) {
    fail(`meta.description is ${meta.description.length} chars, max ${DESCRIPTION_MAX}`);
  }
  if (typeof meta.fn !== 'function') fail('meta.fn must be a function');
  if (!INPUT_TYPES.includes(meta.inputType)) fail(`meta.inputType must be one of ${INPUT_TYPES.join(', ')}`);
  if (!RESULT_TYPES.includes(meta.resultType)) fail(`meta.resultType must be one of ${RESULT_TYPES.join(', ')}`);
  if (typeof meta.quick !== 'boolean') fail('meta.quick must be a boolean');
  if (meta.quick && (meta.inputType !== 'string' || meta.resultType !== 'string')) {
    fail('quick utilities must be string → string');
  }
  return meta;
}

/** Validates every module's meta and returns them sorted by category, then name. */
export function buildRegistry(mods) {
  const list = [];
  const seen = new Set();
  for (const [file, mod] of Object.entries(mods)) {
    const meta = validate(mod?.meta, file);
    if (seen.has(meta.name)) throw new Error(`Utility ${file}: duplicate name "${meta.name}"`);
    seen.add(meta.name);
    list.push(meta);
  }
  return list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export const utilities = buildRegistry(modules);
export const quickUtilities = utilities.filter((u) => u.quick);
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: 3 files, all passed (registry 15, run 12, hexdump 7).

- [x] **Step 5: Commit**

```powershell
git add src/registry.js tests/registry.test.js
git commit -m "Add utility registry with meta validation"
```

---

### Task 5: Tab bar and app skeleton

**Files:**
- Create: `src/ui/tabs.js`
- Modify: `src/main.js`, `src/style.css`
- Test: `tests/ui/tabs.test.js`

**Interfaces:**
- Produces: `createTabBar(root) → { add({ title, closable, panelEl }) → id, activate(id), setTitle(id, title), close(id), onAdd(fn) }`. Panels are shown and hidden with the `hidden` attribute. Closing the active tab activates its left neighbour.

- [x] **Step 0a: Write the failing tests**

`tests/ui/tabs.test.js`:
```js
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createTabBar } from '../../src/ui/tabs.js';

function setup() {
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById('app');
  const bar = createTabBar(root);
  const panel = (text) => { const el = document.createElement('div'); el.textContent = text; return el; };
  return { root, bar, panel };
}
const titles = (root) => [...root.querySelectorAll('.tab-title')].map((e) => e.textContent);
const activeTitle = (root) => root.querySelector('.tab.active .tab-title').textContent;
const visiblePanels = (root) => [...root.querySelectorAll('.tab-panels > *')].filter((p) => !p.hidden).map((p) => p.textContent);

describe('createTabBar', () => {
  it('renders a strip, a + button and an empty panel container', () => {
    const { root } = setup();
    expect(root.querySelector('.tab-bar .tab-strip')).not.toBeNull();
    expect(root.querySelector('.tab-bar .tab-add').textContent).toBe('+');
    expect(root.querySelector('.tab-panels').children.length).toBe(0);
  });

  it('add() appends a tab, activates it and shows only its panel', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('pa') });
    bar.add({ title: 'B', panelEl: panel('pb') });
    expect(titles(root)).toEqual(['A', 'B']);
    expect(activeTitle(root)).toBe('B');
    expect(visiblePanels(root)).toEqual(['pb']);
  });

  it('closable tabs get a × button; non-closable ones do not', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'Quick', closable: false, panelEl: panel('q') });
    bar.add({ title: 'A', panelEl: panel('a') });
    const tabs = root.querySelectorAll('.tab');
    expect(tabs[0].querySelector('.tab-close')).toBeNull();
    expect(tabs[1].querySelector('.tab-close')).not.toBeNull();
  });

  it('clicking a tab activates it', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    bar.add({ title: 'B', panelEl: panel('b') });
    root.querySelectorAll('.tab')[0].click();
    expect(activeTitle(root)).toBe('A');
    expect(visiblePanels(root)).toEqual(['a']);
  });

  it('setTitle relabels a tab and ignores unknown ids', () => {
    const { root, bar, panel } = setup();
    const id = bar.add({ title: 'Untitled', panelEl: panel('a') });
    bar.setTitle(id, 'hexdump → text');
    bar.setTitle(999, 'nope');
    expect(titles(root)).toEqual(['hexdump → text']);
  });

  it('closing the active tab activates its left neighbour and removes the panel', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'Quick', closable: false, panelEl: panel('q') });
    bar.add({ title: 'A', panelEl: panel('a') });
    const b = bar.add({ title: 'B', panelEl: panel('b') });
    bar.close(b);
    expect(titles(root)).toEqual(['Quick', 'A']);
    expect(activeTitle(root)).toBe('A');
    expect(visiblePanels(root)).toEqual(['a']);
  });

  it('closing a non-active tab leaves the active one alone', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    const b = bar.add({ title: 'B', panelEl: panel('b') });
    bar.add({ title: 'C', panelEl: panel('c') });
    bar.close(b);
    expect(titles(root)).toEqual(['A', 'C']);
    expect(activeTitle(root)).toBe('C');
  });

  it('closing the last remaining tab leaves nothing active', () => {
    const { root, bar, panel } = setup();
    const a = bar.add({ title: 'A', panelEl: panel('a') });
    bar.close(a);
    expect(titles(root)).toEqual([]);
    expect(root.querySelector('.tab.active')).toBeNull();
  });

  it('close() with an unknown id is a no-op', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    bar.close(999);
    expect(titles(root)).toEqual(['A']);
  });

  it('the × button closes without activating the tab first', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    bar.add({ title: 'B', panelEl: panel('b') });
    bar.add({ title: 'C', panelEl: panel('c') });
    root.querySelectorAll('.tab')[0].click();
    root.querySelectorAll('.tab')[2].querySelector('.tab-close').click();
    expect(titles(root)).toEqual(['A', 'B']);
    expect(activeTitle(root)).toBe('A');
  });

  it('clicking + calls the onAdd handler; without one it is a no-op', () => {
    const { root, bar } = setup();
    root.querySelector('.tab-add').click();
    const onAdd = vi.fn();
    bar.onAdd(onAdd);
    root.querySelector('.tab-add').click();
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
```

- [x] **Step 0b: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, cannot resolve `../../src/ui/tabs.js`.

- [x] **Step 1: Implement `src/ui/tabs.js`**

```js
/**
 * Tab bar: a strip of tab buttons plus a "+" button, and a panel container
 * that shows exactly one panel at a time.
 */
let nextId = 1;

export function createTabBar(root) {
  const bar = document.createElement('div');
  bar.className = 'tab-bar';
  const strip = document.createElement('div');
  strip.className = 'tab-strip';
  const addBtn = document.createElement('button');
  addBtn.className = 'tab-add';
  addBtn.textContent = '+';
  addBtn.title = 'New tab';
  bar.append(strip, addBtn);

  const panels = document.createElement('div');
  panels.className = 'tab-panels';
  root.append(bar, panels);

  const tabs = [];
  let activeId = null;
  let addHandler = () => {};

  function render() {
    for (const t of tabs) {
      t.tabEl.classList.toggle('active', t.id === activeId);
      t.panelEl.hidden = t.id !== activeId;
    }
  }

  function add({ title, closable = true, panelEl }) {
    const id = nextId++;
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    const label = document.createElement('span');
    label.className = 'tab-title';
    label.textContent = title;
    tabEl.append(label);
    if (closable) {
      const x = document.createElement('button');
      x.className = 'tab-close';
      x.textContent = '×';
      x.title = 'Close tab';
      x.addEventListener('click', (e) => { e.stopPropagation(); close(id); });
      tabEl.append(x);
    }
    tabEl.addEventListener('click', () => activate(id));
    strip.append(tabEl);
    panels.append(panelEl);
    tabs.push({ id, tabEl, label, panelEl });
    activate(id);
    return id;
  }

  function activate(id) {
    activeId = id;
    render();
  }

  function setTitle(id, title) {
    const t = tabs.find((t) => t.id === id);
    if (t) t.label.textContent = title;
  }

  function close(id) {
    const i = tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    const [t] = tabs.splice(i, 1);
    t.tabEl.remove();
    t.panelEl.remove();
    if (activeId === id) activeId = tabs[Math.max(0, i - 1)]?.id ?? null;
    render();
  }

  addBtn.addEventListener('click', () => addHandler());

  return { add, activate, setTitle, close, onAdd(fn) { addHandler = fn; } };
}
```

- [x] **Step 2: Replace `src/main.js` with a skeleton that uses placeholder panels**

```js
import { createTabBar } from './ui/tabs.js';

const root = document.getElementById('app');
const bar = createTabBar(root);

function placeholder(text) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.textContent = text;
  return el;
}

bar.add({ title: 'Quick', closable: false, panelEl: placeholder('Quick tab (coming in Task 7)') });
bar.onAdd(() => bar.add({ title: 'Untitled', panelEl: placeholder('Regular tab (coming in Task 6)') }));
bar.add({ title: 'Untitled', panelEl: placeholder('Regular tab (coming in Task 6)') });
```

- [x] **Step 3: Replace `src/style.css` with the full stylesheet**

```css
:root { font-family: system-ui, sans-serif; font-size: 13px; color: #223; background: #f0f1f5; }
html, body, #app { height: 100%; margin: 0; }
#app { display: flex; flex-direction: column; }

/* tab bar */
.tab-bar { display: flex; align-items: flex-end; gap: 4px; padding: 6px 8px 0; border-bottom: 1px solid #bbc; background: #e4e6ec; }
.tab-strip { display: flex; gap: 4px; overflow-x: auto; }
.tab { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid #bbc; border-bottom: none; border-radius: 6px 6px 0 0; background: #eee; color: #556; cursor: pointer; white-space: nowrap; user-select: none; }
.tab.active { background: #fff; color: #223; font-weight: 600; }
.tab-close { border: none; background: none; cursor: pointer; color: #889; padding: 0 2px; font-size: 14px; line-height: 1; }
.tab-close:hover { color: #c33; }
.tab-add { border: 1px solid #bbc; background: #fff; border-radius: 6px 6px 0 0; padding: 6px 10px; cursor: pointer; }

/* panels */
.tab-panels { flex: 1; min-height: 0; display: flex; }
.panel { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 8px; gap: 8px; }
.panel[hidden] { display: none; }

/* regular tab */
.toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.toolbar select, .toolbar button { font: inherit; padding: 4px 8px; }
.status { margin-left: auto; color: #778; font-size: 12px; }
.areas { flex: 1; min-height: 0; display: flex; gap: 8px; }
.stacked .areas { flex-direction: column; }
.side-by-side .areas { flex-direction: row; }
.area { flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column; }
.area-head { display: flex; justify-content: space-between; font-size: 11px; text-transform: uppercase; color: #778; margin-bottom: 3px; }
textarea { font-family: ui-monospace, Consolas, monospace; font-size: 12px; border: 1px solid #bbc; border-radius: 4px; padding: 6px 8px; background: #f7f8fb; resize: none; }
.area textarea { flex: 1; }
textarea.output { background: #eef6ee; border-color: #9c9; }
textarea.error { background: #fbeeee; border-color: #c33; }

/* quick tab */
.quick { overflow-y: auto; }
.quick-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid #ccd; border-radius: 6px; background: #fff; }
.quick-name { min-width: 150px; font-weight: 600; }
.quick-row textarea { flex: 1; min-width: 0; }
.quick-row .status { margin-left: 0; min-width: 60px; }
```

- [ ] **Step 4: Verify in the browser** _(not done in a browser; covered by the jsdom suites in tests/ui and tests/main.test.js. Manual pass pending.)_

Run: `pnpm dev` and open http://localhost:5173 in a browser.
Check each:
- Two tabs: "Quick" (no ×) and "Untitled" (with ×). "Untitled" is active.
- Clicking "+" adds another "Untitled" tab and activates it.
- Clicking a tab shows its panel; the others are hidden.
- Closing the active tab activates the tab to its left. Closing a non-active tab leaves the active one alone.
- "Quick" cannot be closed.

Stop the dev server (Ctrl+C).

- [x] **Step 5: Run tests and commit**

Run: `pnpm test`
Expected: all pass, `tests/ui/tabs.test.js` 11 passed.

```powershell
git add src/ui/tabs.js src/main.js src/style.css tests/ui/tabs.test.js
git commit -m "Add tab bar and app skeleton"
```

---

### Task 6: Regular tab panel

**Files:**
- Create: `src/ui/clipboard.js`, `src/ui/tab-panel.js`
- Modify: `src/main.js`
- Test: `tests/ui/clipboard.test.js`, `tests/ui/tab-panel.test.js`

**Interfaces:**
- Consumes: `execute` from `src/ui/run.js`; `utilities` from `src/registry.js`; `createTabBar` from `src/ui/tabs.js`.
- Produces: `copyText(text, statusEl) → Promise<void>`; `createTabPanel({ utilities, onTitleChange, onSendToNewTab }) → { el, setInput(text) }`.

- [x] **Step 0a: Write the failing clipboard tests**

`tests/ui/clipboard.test.js`:
```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyText } from '../../src/ui/clipboard.js';

function mockClipboard(impl) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(impl) }, configurable: true });
  return navigator.clipboard.writeText;
}

describe('copyText', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('writes the text and flashes "Copied", then restores the previous status', async () => {
    const writeText = mockClipboard(() => Promise.resolve());
    const status = document.createElement('span');
    status.textContent = 'idle';
    await copyText('hello', status);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(status.textContent).toBe('Copied');
    vi.advanceTimersByTime(1500);
    expect(status.textContent).toBe('idle');
  });

  it('reports a failure message', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    const status = document.createElement('span');
    await copyText('x', status);
    expect(status.textContent).toBe('Copy failed: denied');
  });

  it('does not overwrite a status that changed during the flash', async () => {
    mockClipboard(() => Promise.resolve());
    const status = document.createElement('span');
    await copyText('x', status);
    status.textContent = 'something newer';
    vi.advanceTimersByTime(1500);
    expect(status.textContent).toBe('something newer');
  });
});
```

- [x] **Step 0b: Write the failing tab-panel tests**

`tests/ui/tab-panel.test.js`:
```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTabPanel } from '../../src/ui/tab-panel.js';

const upper = { name: 'upper', description: 'Uppercase', category: 'text', fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true };
const count = { name: 'count', description: 'Count lines', category: 'lines', fn: (x) => (Array.isArray(x) ? `${x.length} lines` : 'one string'), inputType: 'both', resultType: 'string', quick: false };
const boom = { name: 'boom', description: 'Always throws', category: 'text', fn: () => { throw new Error('kaboom'); }, inputType: 'string', resultType: 'string', quick: false };

function setup() {
  const onTitleChange = vi.fn();
  const onSendToNewTab = vi.fn();
  const panel = createTabPanel({ utilities: [count, boom, upper], onTitleChange, onSendToNewTab });
  document.body.innerHTML = '';
  document.body.append(panel.el);
  const $ = (sel) => panel.el.querySelector(sel);
  const pick = (name) => { $('.util-select').value = name; $('.util-select').dispatchEvent(new Event('change')); };
  return { panel, $, pick, onTitleChange, onSendToNewTab };
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
});

describe('createTabPanel toolbar', () => {
  it('lists utilities grouped by category after a blank option', () => {
    const { $ } = setup();
    const select = $('.util-select');
    expect(select.options[0].value).toBe('');
    const groups = [...select.querySelectorAll('optgroup')].map((g) => [g.label, [...g.options].map((o) => o.value)]);
    expect(groups).toEqual([['lines', ['count']], ['text', ['boom', 'upper']]]);
  });

  it('selecting a utility retitles the tab and shows description and types', () => {
    const { $, pick, onTitleChange } = setup();
    pick('upper');
    expect(onTitleChange).toHaveBeenLastCalledWith('upper');
    expect($('.status').textContent).toBe('Uppercase · string → string');
    pick('');
    expect(onTitleChange).toHaveBeenLastCalledWith('Untitled');
    expect($('.status').textContent).toBe('');
  });

  it('shows the Split lines checkbox only for inputType both', () => {
    const { $, pick } = setup();
    expect($('.split-lines').hidden).toBe(true);
    pick('count');
    expect($('.split-lines').hidden).toBe(false);
    pick('upper');
    expect($('.split-lines').hidden).toBe(true);
  });

  it('starts stacked and toggles to side by side and back', () => {
    const { $, panel } = setup();
    expect(panel.el.classList.contains('stacked')).toBe(true);
    $('.btn-layout').click();
    expect(panel.el.classList.contains('side-by-side')).toBe(true);
    expect(panel.el.classList.contains('stacked')).toBe(false);
    expect($('.btn-layout').textContent).toBe('Stacked');
    $('.btn-layout').click();
    expect(panel.el.classList.contains('stacked')).toBe(true);
    expect($('.btn-layout').textContent).toBe('Side by side');
  });
});

describe('createTabPanel execution', () => {
  it('asks for a utility when none is selected', () => {
    const { $ } = setup();
    $('.input').value = 'abc';
    $('.btn-execute').click();
    expect($('.output').value).toBe('Select a utility');
    expect($('.output').classList.contains('error')).toBe(true);
  });

  it('runs the selected utility and clears a previous error state', () => {
    const { $, pick } = setup();
    $('.btn-execute').click();
    pick('upper');
    $('.input').value = 'abc';
    $('.btn-execute').click();
    expect($('.output').value).toBe('ABC');
    expect($('.output').classList.contains('error')).toBe(false);
  });

  it('shows a thrown error in red', () => {
    const { $, pick } = setup();
    pick('boom');
    $('.btn-execute').click();
    expect($('.output').value).toBe('kaboom');
    expect($('.output').classList.contains('error')).toBe(true);
  });

  it('passes the Split lines choice through for inputType both', () => {
    const { $, pick } = setup();
    pick('count');
    $('.input').value = 'a\nb\nc';
    $('.btn-execute').click();
    expect($('.output').value).toBe('one string');
    $('.chk-split').checked = true;
    $('.btn-execute').click();
    expect($('.output').value).toBe('3 lines');
  });

  it('Ctrl+Enter in the input runs; plain Enter does not', () => {
    const { $, pick } = setup();
    pick('upper');
    $('.input').value = 'x';
    $('.input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect($('.output').value).toBe('');
    $('.input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    expect($('.output').value).toBe('X');
  });
});

describe('createTabPanel buttons and toggles', () => {
  it('Clear empties both areas and removes the error state', () => {
    const { $ } = setup();
    $('.input').value = 'abc';
    $('.btn-execute').click();
    $('.btn-clear').click();
    expect($('.input').value).toBe('');
    expect($('.output').value).toBe('');
    expect($('.output').classList.contains('error')).toBe(false);
  });

  it('Copy output writes the output to the clipboard', async () => {
    const { $, pick } = setup();
    pick('upper');
    $('.input').value = 'abc';
    $('.btn-execute').click();
    $('.btn-copy').click();
    await Promise.resolve();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC');
  });

  it('Send output to new tab hands the output to the callback', () => {
    const { $, pick, onSendToNewTab } = setup();
    pick('upper');
    $('.input').value = 'abc';
    $('.btn-execute').click();
    $('.btn-send').click();
    expect(onSendToNewTab).toHaveBeenCalledWith('ABC');
  });

  it('Wrap checkboxes control each textarea independently, off by default', () => {
    const { $ } = setup();
    const [inWrap, outWrap] = $('.areas').querySelectorAll('.chk-wrap');
    expect($('.input').getAttribute('wrap')).toBe('off');
    expect($('.output').getAttribute('wrap')).toBe('off');
    inWrap.checked = true;
    inWrap.dispatchEvent(new Event('change'));
    expect($('.input').getAttribute('wrap')).toBe('soft');
    expect($('.output').getAttribute('wrap')).toBe('off');
    inWrap.checked = false;
    inWrap.dispatchEvent(new Event('change'));
    expect($('.input').getAttribute('wrap')).toBe('off');
    outWrap.checked = true;
    outWrap.dispatchEvent(new Event('change'));
    expect($('.output').getAttribute('wrap')).toBe('soft');
  });

  it('setInput fills the input area', () => {
    const { $, panel } = setup();
    panel.setInput('seed');
    expect($('.input').value).toBe('seed');
  });
});
```

- [x] **Step 0c: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, cannot resolve `../../src/ui/clipboard.js` and `../../src/ui/tab-panel.js`.

- [x] **Step 1: Implement `src/ui/clipboard.js`**

```js
/** Copy text to the clipboard and show a short status message in `statusEl`. */
export async function copyText(text, statusEl) {
  try {
    await navigator.clipboard.writeText(text);
    flash(statusEl, 'Copied');
  } catch (err) {
    flash(statusEl, `Copy failed: ${err.message}`);
  }
}

function flash(el, msg) {
  const prev = el.textContent;
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = prev; }, 1500);
}
```

- [x] **Step 2: Implement `src/ui/tab-panel.js`**

```js
import { execute } from './run.js';
import { copyText } from './clipboard.js';

/**
 * One regular tab: toolbar (utility selector, Execute, Copy output, Clear,
 * Send output to new tab, layout toggle, Split lines, status) over an input
 * textarea and a read-only output textarea.
 */
export function createTabPanel({ utilities, onTitleChange, onSendToNewTab }) {
  const el = document.createElement('div');
  el.className = 'panel stacked';
  el.innerHTML = `
    <div class="toolbar">
      <select class="util-select"><option value="">— select utility —</option></select>
      <button class="btn-execute" title="Ctrl+Enter">Execute</button>
      <button class="btn-copy">Copy output</button>
      <button class="btn-clear">Clear</button>
      <button class="btn-send">Send output to new tab</button>
      <button class="btn-layout">Side by side</button>
      <label class="split-lines" hidden><input type="checkbox" class="chk-split"> Split lines</label>
      <span class="status"></span>
    </div>
    <div class="areas">
      <div class="area">
        <div class="area-head"><span>Input</span><label><input type="checkbox" class="chk-wrap"> Wrap</label></div>
        <textarea class="input" wrap="off" spellcheck="false"></textarea>
      </div>
      <div class="area">
        <div class="area-head"><span>Output</span><label><input type="checkbox" class="chk-wrap"> Wrap</label></div>
        <textarea class="output" wrap="off" spellcheck="false" readonly></textarea>
      </div>
    </div>`;

  const $ = (sel) => el.querySelector(sel);
  const select = $('.util-select');
  const input = $('.input');
  const output = $('.output');
  const status = $('.status');
  const splitLabel = $('.split-lines');
  const splitChk = $('.chk-split');

  const groups = new Map();
  for (const u of utilities) {
    if (!groups.has(u.category)) {
      const g = document.createElement('optgroup');
      g.label = u.category;
      groups.set(u.category, g);
      select.append(g);
    }
    const o = document.createElement('option');
    o.value = u.name;
    o.textContent = u.name;
    groups.get(u.category).append(o);
  }
  const byName = new Map(utilities.map((u) => [u.name, u]));
  const current = () => byName.get(select.value) ?? null;

  function showResult(res) {
    output.value = res.ok ? res.output : res.error;
    output.classList.toggle('error', !res.ok);
  }

  function run() {
    const meta = current();
    if (!meta) { showResult({ ok: false, error: 'Select a utility' }); return; }
    showResult(execute(meta, input.value, { splitLines: splitChk.checked }));
  }

  select.addEventListener('change', () => {
    const meta = current();
    splitLabel.hidden = meta?.inputType !== 'both';
    status.textContent = meta ? `${meta.description} · ${meta.inputType} → ${meta.resultType}` : '';
    onTitleChange(meta ? meta.name : 'Untitled');
  });
  $('.btn-execute').addEventListener('click', run);
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  $('.btn-clear').addEventListener('click', () => {
    input.value = '';
    output.value = '';
    output.classList.remove('error');
  });
  $('.btn-copy').addEventListener('click', () => copyText(output.value, status));
  $('.btn-send').addEventListener('click', () => onSendToNewTab(output.value));
  $('.btn-layout').addEventListener('click', (e) => {
    const side = el.classList.toggle('side-by-side');
    el.classList.toggle('stacked', !side);
    e.currentTarget.textContent = side ? 'Stacked' : 'Side by side';
  });
  for (const chk of el.querySelectorAll('.chk-wrap')) {
    chk.addEventListener('change', () => {
      chk.closest('.area').querySelector('textarea').setAttribute('wrap', chk.checked ? 'soft' : 'off');
    });
  }

  return {
    el,
    setInput(text) { input.value = text; },
  };
}
```

- [x] **Step 3: Update `src/main.js` to use real regular tabs**

```js
import { utilities } from './registry.js';
import { createTabBar } from './ui/tabs.js';
import { createTabPanel } from './ui/tab-panel.js';

const root = document.getElementById('app');
const bar = createTabBar(root);

function placeholder(text) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.textContent = text;
  return el;
}

function newTab(initialInput = '') {
  let id;
  const panel = createTabPanel({
    utilities,
    onTitleChange: (title) => bar.setTitle(id, title),
    onSendToNewTab: (text) => newTab(text),
  });
  panel.setInput(initialInput);
  id = bar.add({ title: 'Untitled', closable: true, panelEl: panel.el });
  return id;
}

bar.add({ title: 'Quick', closable: false, panelEl: placeholder('Quick tab (coming in Task 7)') });
bar.onAdd(() => newTab());
newTab();
```

- [ ] **Step 4: Verify in the browser** _(not done in a browser; covered by the jsdom suites in tests/ui and tests/main.test.js. Manual pass pending.)_

Run: `pnpm dev`, open http://localhost:5173.
Check each:
- Dropdown shows an optgroup "hex" containing "hexdump → text". Selecting it retitles the tab and the status reads "Decode hex dumps to text · string → string".
- Execute with no utility selected shows "Select a utility" in a red-bordered output.
- Paste `7b0022006d0073006700730022003a00`, Execute → output `{"msgs":`, green border.
- Paste `abc`, Execute → output `Odd hex length (3)`, red border. Run a good input again → border back to green.
- Ctrl+Enter in the input runs Execute.
- Type a very long line: it does not wrap. Tick Wrap on that area: it wraps. Untick: back to no wrap. Each area's Wrap is independent.
- "Side by side" puts the areas left/right and the button reads "Stacked"; clicking again restores stacked.
- Clear empties both areas and removes the red border.
- Copy output puts the output on the clipboard and the status briefly reads "Copied".
- Send output to new tab opens a new "Untitled" tab whose input is the previous output.
- The Split lines checkbox is not visible (the only utility is `string`).

Stop the dev server.

- [x] **Step 5: Run tests and commit**

Run: `pnpm test`
Expected: all pass.

```powershell
git add src/ui/clipboard.js src/ui/tab-panel.js src/main.js tests/ui/clipboard.test.js tests/ui/tab-panel.test.js
git commit -m "Add regular tab panel with execute, layout and wrap toggles"
```

---

### Task 7: Quick tab panel

**Files:**
- Create: `src/ui/quick-panel.js`
- Modify: `src/main.js`
- Test: `tests/ui/quick-panel.test.js`

**Interfaces:**
- Consumes: `execute` from `src/ui/run.js`; `copyText` from `src/ui/clipboard.js`; `quickUtilities` from `src/registry.js`.
- Produces: `createQuickPanel({ utilities }) → { el }`.

- [x] **Step 0a: Write the failing tests**

`tests/ui/quick-panel.test.js`:
```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuickPanel } from '../../src/ui/quick-panel.js';

const upper = { name: 'upper', description: 'Uppercase', category: 'text', fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true };
const boom = { name: 'boom', description: 'Always throws', category: 'text', fn: () => { throw new Error('kaboom'); }, inputType: 'string', resultType: 'string', quick: true };

function setup(utilities = [upper, boom]) {
  const panel = createQuickPanel({ utilities });
  document.body.innerHTML = '';
  document.body.append(panel.el);
  const rows = [...panel.el.querySelectorAll('.quick-row')];
  const of = (row) => ({
    name: row.querySelector('.quick-name'),
    input: row.querySelector('.input'),
    output: row.querySelector('.output'),
    run: row.querySelector('.btn-run'),
    copy: row.querySelector('.btn-copy'),
    status: row.querySelector('.status'),
  });
  return { panel, rows: rows.map(of) };
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
});

describe('createQuickPanel', () => {
  it('explains itself when no utility is quick', () => {
    const { panel } = setup([]);
    expect(panel.el.textContent).toBe('No utilities are marked quick: true.');
    expect(panel.el.querySelector('.quick-row')).toBeNull();
  });

  it('renders one row per utility with its name and description tooltip', () => {
    const { rows } = setup();
    expect(rows.map((r) => r.name.textContent)).toEqual(['upper', 'boom']);
    expect(rows[0].name.title).toBe('Uppercase');
    expect(rows[0].output.readOnly).toBe(true);
    expect(rows[0].input.getAttribute('wrap')).toBe('off');
  });

  it('▶ runs the row utility on its own input', () => {
    const { rows } = setup();
    rows[0].input.value = 'abc';
    rows[0].run.click();
    expect(rows[0].output.value).toBe('ABC');
    expect(rows[0].output.classList.contains('error')).toBe(false);
    expect(rows[1].output.value).toBe('');
  });

  it('shows an error in red and clears it on the next good run', () => {
    const { rows } = setup();
    rows[1].run.click();
    expect(rows[1].output.value).toBe('kaboom');
    expect(rows[1].output.classList.contains('error')).toBe(true);
  });

  it('Ctrl+Enter runs the row; plain Enter does not', () => {
    const { rows } = setup();
    rows[0].input.value = 'x';
    rows[0].input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(rows[0].output.value).toBe('');
    rows[0].input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    expect(rows[0].output.value).toBe('X');
  });

  it('grows the input from one row up to four as lines are typed', () => {
    const { rows } = setup();
    const { input } = rows[0];
    expect(input.rows).toBe(1);
    input.value = 'a\nb\nc';
    input.dispatchEvent(new Event('input'));
    expect(input.rows).toBe(3);
    input.value = 'a\nb\nc\nd\ne\nf\ng\nh';
    input.dispatchEvent(new Event('input'));
    expect(input.rows).toBe(4);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(input.rows).toBe(1);
  });

  it('sizes the output to its result the same way', () => {
    const multi = { ...upper, name: 'lines', fn: () => 'a\nb\nc\nd\ne' };
    const { rows } = setup([multi]);
    rows[0].run.click();
    expect(rows[0].output.rows).toBe(4);
  });

  it('Copy writes the row output to the clipboard', async () => {
    const { rows } = setup();
    rows[0].input.value = 'abc';
    rows[0].run.click();
    rows[0].copy.click();
    await Promise.resolve();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC');
  });
});
```

- [x] **Step 0b: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, cannot resolve `../../src/ui/quick-panel.js`.

- [x] **Step 1: Implement `src/ui/quick-panel.js`**

```js
import { execute } from './run.js';
import { copyText } from './clipboard.js';

const MAX_ROWS = 4;

/** The Quick tab: one row per quick utility (name, input, ▶, output, Copy). */
export function createQuickPanel({ utilities }) {
  const el = document.createElement('div');
  el.className = 'panel quick';
  if (utilities.length === 0) {
    el.textContent = 'No utilities are marked quick: true.';
    return { el };
  }
  for (const meta of utilities) el.append(createRow(meta));
  return { el };
}

function createRow(meta) {
  const row = document.createElement('div');
  row.className = 'quick-row';
  row.innerHTML = `
    <span class="quick-name"></span>
    <textarea class="input" rows="1" wrap="off" spellcheck="false"></textarea>
    <button class="btn-run" title="Execute (Ctrl+Enter)">▶</button>
    <textarea class="output" rows="1" wrap="off" spellcheck="false" readonly></textarea>
    <button class="btn-copy">Copy</button>
    <span class="status"></span>`;

  const name = row.querySelector('.quick-name');
  name.textContent = meta.name;
  name.title = meta.description;
  const input = row.querySelector('.input');
  const output = row.querySelector('.output');
  const status = row.querySelector('.status');

  function run() {
    const res = execute(meta, input.value);
    output.value = res.ok ? res.output : res.error;
    output.classList.toggle('error', !res.ok);
    autosize(output);
  }

  row.querySelector('.btn-run').addEventListener('click', run);
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  input.addEventListener('input', () => autosize(input));
  row.querySelector('.btn-copy').addEventListener('click', () => copyText(output.value, status));
  return row;
}

/** Grow a textarea from one row up to MAX_ROWS to fit its content; beyond that it scrolls. */
function autosize(ta) {
  const lines = ta.value.split('\n').length;
  ta.rows = Math.min(MAX_ROWS, Math.max(1, lines));
}
```

- [x] **Step 2: Update `src/main.js` to use the real Quick panel**

```js
import { utilities, quickUtilities } from './registry.js';
import { createTabBar } from './ui/tabs.js';
import { createTabPanel } from './ui/tab-panel.js';
import { createQuickPanel } from './ui/quick-panel.js';

const root = document.getElementById('app');
const bar = createTabBar(root);

function newTab(initialInput = '') {
  let id;
  const panel = createTabPanel({
    utilities,
    onTitleChange: (title) => bar.setTitle(id, title),
    onSendToNewTab: (text) => newTab(text),
  });
  panel.setInput(initialInput);
  id = bar.add({ title: 'Untitled', closable: true, panelEl: panel.el });
  return id;
}

bar.add({ title: 'Quick', closable: false, panelEl: createQuickPanel({ utilities: quickUtilities }).el });
bar.onAdd(() => newTab());
newTab();
```

- [ ] **Step 3: Verify in the browser** _(not done in a browser; covered by the jsdom suites in tests/ui and tests/main.test.js. Manual pass pending.)_

Run: `pnpm dev`, open http://localhost:5173, click the Quick tab.
Check each:
- One row: "hexdump → text" with a tooltip "Decode hex dumps to text" on hover.
- Paste `68656c6c6f`, press ▶ → output `hello`.
- Paste a three-line dump: the input grows to three rows. Paste eight lines: it stops at four rows and scrolls.
- Ctrl+Enter in the row's input runs it.
- Paste `abc`, ▶ → output `Odd hex length (3)` with a red border.
- Copy puts the output on the clipboard; the row's status reads "Copied" briefly.
- Switching to a regular tab and back keeps the row's text.

Stop the dev server.

- [x] **Step 4: Run tests and commit**

Run: `pnpm test`
Expected: all pass.

```powershell
git add src/ui/quick-panel.js src/main.js tests/ui/quick-panel.test.js
git commit -m "Add Quick tab with one row per quick utility"
```

Then run `pnpm coverage`. Expected: every file under `src/` except the excluded two at 100% lines, functions, branches and statements. If a line is uncovered, add a test for it before moving on.

---

### Task 8: Run inside Tauri, verify window state, build

**Files:**
- Possibly modify: `src-tauri/tauri.conf.json`, `src/ui/clipboard.js` (only if clipboard fails in the webview)

**Interfaces:**
- Consumes: everything above.
- Produces: a working `pnpm tauri dev` and a built executable under `src-tauri/target/release/`.

- [x] **Step 1: Run the app in Tauri**

Run: `pnpm tauri dev` (first run compiles Rust, allow several minutes).
Expected: a window titled "convert-extract" opens showing the Quick tab and an "Untitled" tab.

- [ ] **Step 2: Repeat the Task 6 and Task 7 checklists inside the Tauri window** _(pending: needs a person at the Tauri window)_

Pay particular attention to Copy. If the status reads "Copy failed: ..." in the Tauri window, do the following and re-test:

Run: `pnpm tauri add clipboard-manager`

Replace `src/ui/clipboard.js` with:
```js
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

/** Copy text to the clipboard and show a short status message in `statusEl`. */
export async function copyText(text, statusEl) {
  try {
    if (window.__TAURI_INTERNALS__) await writeText(text);
    else await navigator.clipboard.writeText(text);
    flash(statusEl, 'Copied');
  } catch (err) {
    flash(statusEl, `Copy failed: ${err.message}`);
  }
}

function flash(el, msg) {
  const prev = el.textContent;
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = prev; }, 1500);
}
```
and confirm `src-tauri/capabilities/default.json` lists `"clipboard-manager:allow-write-text"`.

- [ ] **Step 3: Verify window state persists** _(pending: needs a person at the Tauri window)_

Resize and move the window, close it, run `pnpm tauri dev` again.
Expected: the window reopens at the same size and position. Tabs are back to Quick plus one empty "Untitled" (no text restored).

- [x] **Step 4: Build**

Run: `pnpm tauri build`
Expected: ends with "Finished" and lists bundle paths under `src-tauri/target/release/bundle/` (NSIS and/or MSI installer) plus `src-tauri/target/release/convert-extract.exe`.

Launch `src-tauri/target/release/convert-extract.exe` directly and confirm the Quick tab decodes `68656c6c6f` to `hello`.

- [x] **Step 5: Run tests and commit**

Run: `pnpm test`
Expected: all pass.

```powershell
git add -A
git commit -m "Verify Tauri dev and release build"
```

(If Step 2 added the clipboard plugin, use the message "Use Tauri clipboard plugin for Copy; verify dev and release build".)

---

## Spec coverage check

| Spec section | Task |
|---|---|
| Shell, frontend, toolchain, window-state | 1, 8 |
| Project layout | 1, 3, 4, 5, 6, 7 |
| Registry contract and validation rules | 3, 4 |
| Utility file conventions, `_template.js` | 3 |
| Input and output mapping | 2 |
| Tab bar behaviour | 5 |
| Regular tab toolbar, areas, wrap, layout toggle, Ctrl+Enter, errors | 6 |
| Quick tab rows, autosize, Copy | 7 |
| Error handling | 2, 4, 6, 7 |
| Testing | 2, 3, 4 |
| Build and run | 1, 8 |
