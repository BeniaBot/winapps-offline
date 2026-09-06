// Keeps a running total of downloads that survives an installer being rebuilt.
//
// GitHub counts downloads per RELEASE ASSET, and replacing an asset starts its counter again at
// zero. Every time an installer is rebuilt and re-uploaded, its history disappears - which is why
// Maps, taken for weeks, suddenly read as four.
//
// So the total is kept here instead. Each pass records what GitHub currently says; when that
// number DROPS, the asset was replaced, and whatever it had reached is banked into a carry that
// is never reset. What the site shows is carry + current.
//
// Run as:  node .github/counts.js now.json counts.json
const fs = require('fs');
const [, , nowPath, outPath] = process.argv;

const now = JSON.parse(fs.readFileSync(nowPath, 'utf8'));
let prev = {};
try { prev = JSON.parse(fs.readFileSync(outPath, 'utf8')); } catch (e) { /* first run */ }

const out = {};
for (const a of now) {
  const p = prev[a.name] || { carry: 0, seen: 0 };
  const carry = a.count < p.seen ? p.carry + p.seen : p.carry;
  out[a.name] = { carry: carry, seen: a.count, total: carry + a.count };
}
// an asset that has gone away keeps its history rather than vanishing from the total
for (const k of Object.keys(prev)) if (!(k in out)) out[k] = prev[k];

fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
const total = Object.values(out).reduce((s, v) => s + v.total, 0);
const banked = Object.values(out).reduce((s, v) => s + v.carry, 0);
console.log(Object.keys(out).length + ' assets, ' + total + ' downloads all told (' + banked + ' carried over from replaced files)');
