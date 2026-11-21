// A tiny test harness with no dependencies. Runs on macOS's built-in jsc and, unchanged, on Node.
const out = typeof print === 'function' && typeof window === 'undefined' ? print : (s) => console.log(s);
const results = [];
let finished = false;

export function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
const show = (v) => { try { return typeof v === 'number' ? String(v) : JSON.stringify(v); } catch (e) { return String(v); } };
const same = (a, b) => {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return a !== a && b !== b; /* NaN equals NaN here */
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
};
export function assertEqual(got, want, msg) { if (!same(got, want)) throw new Error((msg ? msg + ': ' : '') + 'expected ' + show(want) + ', got ' + show(got)); }

export function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); out('ok   ' + name); }
  catch (e) { results.push({ name, ok: false, error: e }); out('FAIL ' + name + '\n       ' + (e && e.message ? e.message : e)); }
}

// Prints the last line (PASS n/n or FAIL k of n) and makes the run exit non-zero when anything failed.
export function finish() {
  if (finished) return; finished = true;
  const n = results.length, bad = results.filter((r) => !r.ok).length;
  if (!bad && n) { out('PASS ' + n + '/' + n); return; }
  out(n ? 'FAIL ' + bad + ' of ' + n : 'FAIL 0 of 0 (no tests ran)');
  if (typeof process !== 'undefined' && process && typeof process.exit === 'function') { process.exitCode = 1; return; }
  throw new Error('tests failed'); /* jsc exits non-zero on an uncaught error */
}
// Under Node a test file can be run on its own: the summary is printed when the process ends.
if (typeof process !== 'undefined' && process && typeof process.on === 'function') process.on('exit', finish);
