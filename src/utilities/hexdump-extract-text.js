/**
 * extractText — decode wide-char dumps into readable text.
 *
 * Accepts any of three forms of the same data:
 *   1. Hex-viewer dump (offset, hex bytes, ASCII gutter), e.g.
 *        0000  7b 00 22 00 6d 00 73 00 67 00 73 00 22 00 3a 00  {.".m.s.g.s.".:.
 *      Also `hexdump -C` / `xxd` layouts. Bytes come from the hex column, never
 *      the gutter, since a '.' there may be a NUL, a real period, or any other
 *      unprintable byte.
 *   2. Bare hex:      "7b0022006d0073006700730022003a00\n5b007b00..."
 *   3. Dotted ASCII:  '{.".m.s.g.s.".:.[.{.'   (gutter text alone)
 *
 * Hex input is decoded as UTF-16LE, UTF-16BE, or UTF-8, chosen by where the
 * zero bytes fall. Every non-printable code point (Unicode category C:
 * controls, format chars, unpaired surrogates, private use, unassigned)
 * is inlined as <0xNN> / <0xNNNN>.
 *
 * Works in Node and the browser; no dependencies.
 */

const NONPRINTABLE = /\p{C}/u;

function fmt(cp) {
  const h = cp.toString(16).toUpperCase();
  return `<0x${h.padStart(cp <= 0xff ? 2 : 4, '0')}>`;
}

function render(cp) {
  const ch = String.fromCodePoint(cp);
  return NONPRINTABLE.test(ch) ? fmt(cp) : ch;
}

function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, '');
  if (clean.length % 2) throw new Error(`Odd hex length (${clean.length})`);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

function detectEncoding(bytes) {
  let evenZ = 0, oddZ = 0;
  for (let i = 0; i < bytes.length; i++) if (bytes[i] === 0) (i & 1 ? oddZ++ : evenZ++);
  const half = bytes.length / 2;
  // Zero bytes clustering on one parity is the UTF-16 signature; UTF-8 text
  // essentially never contains NUL. Thresholds tolerate non-Latin runs.
  if (oddZ >= half * 0.3 && oddZ >= evenZ * 2) return 'utf16le';
  if (evenZ >= half * 0.3 && evenZ >= oddZ * 2) return 'utf16be';
  return 'utf8';
}

function decodeUtf16(bytes, le) {
  // BOM
  let i = 0;
  if (bytes.length >= 2) {
    const b = le ? (bytes[1] << 8) | bytes[0] : (bytes[0] << 8) | bytes[1];
    if (b === 0xfeff) i = 2;
  }
  const units = [];
  for (; i + 1 < bytes.length; i += 2)
    units.push(le ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1]);

  let out = '';
  for (let k = 0; k < units.length; k++) {
    const u = units[k];
    if (u >= 0xd800 && u <= 0xdbff && k + 1 < units.length) {
      const lo = units[k + 1];
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        out += render(0x10000 + ((u - 0xd800) << 10) + (lo - 0xdc00));
        k++;
        continue;
      }
    }
    out += render(u); // lone surrogates fall into \p{Cs} → bracketed
  }
  if (bytes.length % 2) out += `<trailing 0x${bytes[bytes.length - 1].toString(16).padStart(2, '0')}>`;
  return out;
}

function decodeUtf8(bytes) {
  const s = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  let out = '';
  for (const ch of s) out += render(ch.codePointAt(0));
  return out;
}

function decodeDotted(text) {
  const s = text.replace(/[\r\n]+/g, '');
  // Separators sit on every other position; real periods survive because
  // only the separator lane is dropped.
  const lane = (start) => { for (let i = start; i < s.length; i += 2) if (s[i] !== '.') return false; return true; };
  let keep;
  if (lane(1)) keep = 0;
  else if (lane(0)) keep = 1;
  else throw new Error('Input is not a uniformly dot-interleaved string');
  let out = '';
  for (let i = keep; i < s.length; i += 2) out += render(s.codePointAt(i));
  return out;
}

const HEX_PAIR = /^[0-9a-fA-F]{2}$/;
const gutterChar = (b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.');

// Matches a dump row: offset, then hex bytes (xxd groups them in 4-char words).
const DUMP_ROW = /^\s*[0-9a-fA-F]{4,}:?\s+(?:[0-9a-fA-F]{2}){1,4}(?:\s|$)/;

function isDump(lines) {
  // hexdump/xxd may end with a bare offset line (total length) or a '*' repeat marker.
  const rows = lines.filter((l) => l.trim() && !/^\s*([0-9a-fA-F]{4,}:?|\*)\s*$/.test(l));
  return rows.length > 0 && rows.every((l) => DUMP_ROW.test(l));
}

/** Bytes from one dump row, gutter excluded. */
function parseDumpRow(line) {
  if (/^\s*\*\s*$/.test(line)) throw new Error("Dump contains a '*' repeat marker; regenerate it with hexdump -v");
  const m = line.match(/^\s*[0-9a-fA-F]+:?/);
  const body = line.slice(m[0].length);
  // Tokenize, remembering where each token ends so the gutter can be checked.
  const toks = [];
  const re = /\S+/g;
  let t;
  while ((t = re.exec(body))) {
    let w = t[0];
    if (w.startsWith('|')) break;                          // hexdump -C gutter
    if (/^[0-9a-fA-F]{4}$/.test(w) || /^[0-9a-fA-F]{8}$/.test(w)) {
      // xxd-style word group: split into pairs
      for (let i = 0; i < w.length; i += 2) toks.push({ hex: w.substr(i, 2), end: re.lastIndex });
      continue;
    }
    if (!HEX_PAIR.test(w)) break;
    toks.push({ hex: w, end: re.lastIndex });
  }
  // Tokens like "ab" at the head of the gutter can pass as hex. Take the
  // longest prefix whose own ASCII rendering is what actually follows it.
  for (let n = toks.length; n > 0; n--) {
    const bytes = toks.slice(0, n).map((x) => parseInt(x.hex, 16));
    const rest = body.slice(toks[n - 1].end).replace(/^\s*\|?/, '');
    if (!rest.trim() || rest.startsWith(bytes.map(gutterChar).join(''))) return bytes;
  }
  return toks.map((x) => parseInt(x.hex, 16)); // no gutter to verify against
}

function dumpToBytes(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) if (line.trim()) out.push(...parseDumpRow(line));
  return Uint8Array.from(out);
}

function decodeBytes(bytes, encoding) {
  const enc = encoding === 'auto' ? detectEncoding(bytes) : encoding;
  if (enc === 'utf16le') return decodeUtf16(bytes, true);
  if (enc === 'utf16be') return decodeUtf16(bytes, false);
  return decodeUtf8(bytes);
}

/**
 * @param {string} input  hex-viewer dump, bare hex, or dot-interleaved text
 * @param {{encoding?: 'auto'|'utf16le'|'utf16be'|'utf8'}} [opts]
 * @returns {string}
 */
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
  quick: false,
};

export default hexdumpExtractText;
