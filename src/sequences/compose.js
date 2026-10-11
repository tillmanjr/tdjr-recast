/**
 * Turn a saved sequence into a meta object the rest of the app can run like
 * any utility: string in, string out, category "sequence".
 *
 * Running feeds the input text to the first step and each step's output text
 * to the next, using the same execute() mapping as a tab, so string and
 * lines utilities chain freely. The first failing step stops the run with
 * "Step N (name): message".
 */
import { execute } from '../ui/run.js';

export function composeSequence(seq, utilitiesByFile) {
  const sequence = structuredClone(seq);
  const n = sequence.steps.length;

  function fn(text) {
    let current = text;
    sequence.steps.forEach((step, i) => {
      const meta = utilitiesByFile.get(step.utility);
      if (!meta) throw new Error(`Step ${i + 1}: unknown utility "${step.utility}"`);
      const res = execute(meta, current, { splitLines: step.splitLines === true });
      if (!res.ok) throw new Error(`Step ${i + 1} (${meta.name}): ${res.error}`);
      current = res.output;
    });
    return current;
  }

  return {
    name: sequence.name,
    description: `${n} step${n === 1 ? '' : 's'}`,
    category: 'sequence',
    fn,
    inputType: 'string',
    resultType: 'string',
    quick: sequence.quick,
    sequence,
  };
}
