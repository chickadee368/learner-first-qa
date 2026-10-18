// WCAG contrast ratio for text/background pairs, with the checklist's severity level for each.
// Usage: node contrast.js "#51606E:#F8F8F7" "#FFFFFF:#7E914A" "#FDF6EC:rgba(194,94,58,0.92)@#FDF6EC" ...
// A see-through background is written rgba(...)@#base, where #base is the color showing through it.
// Levels (checklist.md, severity rules): under 2:1 is Blocked; under the pass line is Detracts.
// Pass lines: 4.5:1 for normal text, 3:1 for large text (24px+, or 18.66px+ bold).
const rgb = c => { c = c.trim();
  const m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) return m[1].split(",").map(Number);
  let h = c.replace("#", ""); if (h.length === 3) h = [...h].map(x => x + x).join("");
  return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const blend = spec => { const [top, base] = spec.split("@"); const t = rgb(top);
  if (t.length < 4 || !base) return t.slice(0, 3);
  const b = rgb(base), a = t[3]; return [0, 1, 2].map(i => Math.round(t[i] * a + b[i] * (1 - a))); };
const lum = c => c.map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const level = (r, line) => r < 2 ? "Blocked" : r < line ? "Detracts" : "Pass";
for (const pair of process.argv.slice(2)) {
  const i = pair.indexOf(":"); // colors never contain a colon, so the first one splits text from background
  const fg = pair.slice(0, i), bg = pair.slice(i + 1);
  const a = lum(blend(fg)), b = lum(blend(bg));
  const r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  console.log(`${r.toFixed(2)}:1  normal text: ${level(r, 4.5)} · large text: ${level(r, 3)}  ${fg} on ${bg}`);
}
