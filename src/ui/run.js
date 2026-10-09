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
