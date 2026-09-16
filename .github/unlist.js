// Keeps published.json and counts.json to the entries the catalogue shows.
//
// Both files are generated from the release's asset list, which is everything the release holds.
// A few entries are not part of the catalogue the page renders; their names travel in extras.json
// instead, and the page merges them back for itself. Regenerating the two lists from the release
// puts those names back into them, so this runs afterwards and takes them out again.
//
// Run as:  node .github/unlist.js published.json counts.json
const fs = require('fs');
const crypto = require('crypto');

// the opaque key an entry keeps when it is held back, so its history survives the pass
const key = n => crypto.createHash('sha256').update(n).digest('hex').slice(0, 16);

const args = process.argv.slice(2);
if (!args.length) { console.error('nothing to filter'); process.exit(1); }

let names = new Set();
try {
  const blob = JSON.parse(fs.readFileSync('extras.json', 'utf8'));
  const payload = JSON.parse(Buffer.from(blob.d, 'base64').toString('utf8'));
  for (const a of payload.apps || []) {
    for (const f of a.files || []) if (f.exe) names.add(f.exe);
    if (a.alt && a.alt.url) names.add(decodeURIComponent(a.alt.url.split('/').pop()));
  }
  for (const n of [...names]) names.add(n.replace(/\.exe$/i, '') + '-Original.exe');
  for (const n of payload.live || []) names.add(n);
} catch (e) {
  // No extras.json, or it does not parse. Filtering nothing is the wrong failure here: it would
  // publish the very names this exists to keep out, and it would do it silently.
  console.error('cannot read extras.json (' + e.message + ') - refusing to publish an unfiltered list');
  process.exit(1);
}

for (const file of args) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.log(file + ': skipped (' + e.message + ')'); continue; }
  let removed = 0;
  if (Array.isArray(data)) {
    const keep = data.filter(n => !names.has(n));
    removed = data.length - keep.length;
    data = keep;
  } else {
    /* counts.json is not just a list, it is a running total: each pass reads the previous file to
       work out what was banked before an asset was replaced. Deleting an entry outright would
       throw that history away on every run. So the entry stays, under an opaque key that says
       nothing about what it is, and counts.js knows to look for it there. */
    for (const k of Object.keys(data)) {
      if (!names.has(k)) continue;
      data['#' + key(k)] = data[k];
      delete data[k];
      removed++;
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
  console.log(file + ': ' + removed + ' entr' + (removed === 1 ? 'y' : 'ies') + ' held back');
}
