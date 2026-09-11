// Splits a trace `d` into subpaths and reads each one's bounding box, so a
// subpath can be classified by where it sits.
const ARGS = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };

export function splitSubpaths(d) {
  return d
    .split(/(?=M)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function bbox(sub) {
  const tokens = sub.match(/[A-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let cmd = 'M';
  let i = 0;
  const xs = [];
  const ys = [];
  while (i < tokens.length) {
    if (/[A-Z]/.test(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === 'Z') continue;
    }
    const n = ARGS[cmd];
    const nums = tokens.slice(i, i + n).map(Number);
    i += n;
    if (cmd === 'H') xs.push(nums[0]);
    else if (cmd === 'V') ys.push(nums[0]);
    else if (cmd === 'A') {
      xs.push(nums[5]);
      ys.push(nums[6]);
    } else
      for (let k = 0; k < nums.length; k += 2) {
        xs.push(nums[k]);
        ys.push(nums[k + 1]);
      }
    if (cmd === 'M') cmd = 'L';
  }
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

export function center(sub) {
  const b = bbox(sub);
  return { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2, w: b.x2 - b.x1, h: b.y2 - b.y1 };
}

export function roundD(d) {
  return d.replace(/-?\d*\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));
}
