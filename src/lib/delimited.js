/**
 * Shared CSV/TSV ⇄ JSON conversion for the data utilities.
 *
 * Writing: a JSON array of objects becomes a header row (the union of keys in
 * first-seen order) plus one row per object; a single object is one row; an
 * array of arrays is written as-is with no header. Cells holding the
 * delimiter, a quote or a line break are quoted RFC 4180 style.
 *
 * Reading: RFC 4180 with the given delimiter; the first record is the header
 * and every later record becomes an object of strings. Blank lines are
 * skipped. Rows shorter than the header are padded with "", longer rows are
 * an error.
 */

export function toDelimited(jsonText, delimiter) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
  return tabulate(data)
    .map((row) => row.map((v) => quote(cell(v), delimiter)).join(delimiter))
    .join('\n');
}

export function fromDelimited(text, delimiter) {
  const records = parseRecords(text, delimiter);
  if (records.length === 0) throw new Error('No header row');
  const [header, ...rows] = records;
  const objects = rows.map((fields, i) => {
    if (fields.length > header.length) {
      throw new Error(`Row ${i + 2} has ${fields.length} fields, header has ${header.length}`);
    }
    return Object.fromEntries(header.map((key, j) => [key, fields[j] ?? '']));
  });
  return JSON.stringify(objects, null, 2);
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const shapeError = () => new Error('Expected a JSON array of objects or arrays');

function tabulate(data) {
  if (isPlainObject(data)) data = [data];
  if (!Array.isArray(data)) throw shapeError();
  if (data.length === 0) return [];
  if (data.every(Array.isArray)) return data;
  if (!data.every(isPlainObject)) throw shapeError();
  const keys = [];
  for (const row of data) {
    for (const k of Object.keys(row)) if (!keys.includes(k)) keys.push(k);
  }
  return [keys, ...data.map((row) => keys.map((k) => row[k]))];
}

function cell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function quote(s, delimiter) {
  const needs = s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r');
  return needs ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseRecords(text, delimiter) {
  const records = [];
  let fields = [];
  let field = '';
  let line = 1;
  let i = 0;
  const n = text.length;

  const endRecord = () => {
    fields.push(field);
    field = '';
    if (!(fields.length === 1 && fields[0] === '')) records.push(fields); // skip blank lines
    fields = [];
  };

  while (i < n) {
    const ch = text[i];
    if (ch === '"') {
      const startLine = line;
      i++;
      for (;;) {
        if (i >= n) throw new Error(`Unterminated quoted field starting on line ${startLine}`);
        if (text[i] === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          i++;
          break;
        }
        if (text[i] === '\n') line++;
        field += text[i++];
      }
      if (i < n && text[i] !== delimiter && text[i] !== '\n' && text[i] !== '\r') {
        throw new Error(`Unexpected text after closing quote on line ${line}`);
      }
      continue;
    }
    if (ch === delimiter) { fields.push(field); field = ''; i++; continue; }
    if (ch === '\r' || ch === '\n') {
      endRecord();
      if (ch === '\r' && text[i + 1] === '\n') i++;
      i++;
      line++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field !== '' || fields.length > 0) endRecord();
  return records;
}
