// Builds the Course QA report (HTML + CSV) from the review data.
// Usage: node build-report.js <review.json> <output-folder> [--names-only]
// review.json:
// {
//   "course": "Course title", "source": "path or link", "startedAt": "ISO time from extract-text.js",
//   "tokens": "about 45k (estimate)",
//   "findings": [{ "level": "Blocked", "also": ["Detracts"], "item": "23", "finding": "...", "impact": "...", "where": "..." }],
//   "items": { "1": { "result": "Pass|Finding|N/A|Unconfirmed|Open", "note": "...", "how": "On screen" }, ... }
// }
// "how" (Open items only): On screen, Screen reader, Source documents, Judgment call.
// Any item may also carry "check": "what a person should look at" (+ "how"), which adds it to Items to check
// even when its result isn't Open. Item 1 uses this for text on photos.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const [inFile, outDir, flag] = process.argv.slice(2);
// --names-only (or --example): show file names only, with no folders, for shared samples and for the Claude app,
// where paths point inside Claude's sandbox. It also drops an upload code like "5611c362-" from the source name.
const example = flag === "--names-only" || flag === "--example";
const here = __dirname;
const R = JSON.parse(fs.readFileSync(inFile, "utf8"));
// Check the shape first, so a gap gets a plain message instead of a crash further down.
const shape = [];
if (typeof R.course !== "string" || !R.course) shape.push('"course" (the course title) is missing.');
if (!Array.isArray(R.findings)) shape.push('"findings" must be a list (use [] if there are none).');
if (!R.items || typeof R.items !== "object" || Array.isArray(R.items)) shape.push('"items" must be an object keyed by checklist number.');
(Array.isArray(R.findings) ? R.findings : []).forEach((f, i) => ["level", "item", "finding", "impact", "where"]
  .forEach(k => { if (!f || !f[k]) shape.push(`Finding ${i + 1} is missing "${k}".`); }));
if (shape.length) { console.log("review.json is missing pieces. Fix these, then run again:"); shape.forEach(s => console.log("  " + s)); process.exit(1); }
const LEVELS = ["Blocked", "Inaccurate", "Detracts", "Adds effort", "Minor error"];
const RESULTS = ["Pass", "Finding", "N/A", "Unconfirmed", "Open"];

// Checklist items, short names and Who checks come from checklist.md, the single source.
const md = fs.readFileSync(path.join(here, "..", "checklist.md"), "utf8");
const checklist = [];
for (const line of md.split("\n")) {
  const m = line.match(/^\| (\d+[a-z]?) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/);
  if (m && !/^\*\*/.test(m[2].trim())) checklist.push({ item: m[1], short: m[2].trim(), criterion: m[3].trim(), who: m[4].trim() });
}
const info = Object.fromEntries(checklist.map(c => [c.item, c]));
const problems = [];

for (const c of checklist) {
  const r = R.items[c.item];
  if (!r) { problems.push(`Item ${c.item} has no result.`); c.result = "Open"; c.note = "Not reviewed."; continue; }
  if (!RESULTS.includes(r.result)) problems.push(`Item ${c.item}: unknown result "${r.result}".`);
  Object.assign(c, { result: r.result, note: r.note || "", how: r.how, check: r.check });
}
for (const k of Object.keys(R.items)) if (!info[k]) problems.push(`Item ${k} is not in checklist.md.`);

const usedIds = new Set();
const fixes = R.findings.map((f, i) => {
  if (!LEVELS.includes(f.level)) problems.push(`Finding ${i + 1}: unknown level "${f.level}".`);
  const items = String(f.item).split(/[ ,]+/).filter(Boolean);
  items.forEach(it => { if (!info[it]) problems.push(`Finding ${i + 1}: item ${it} is not in checklist.md.`); });
  // The id comes from the finding's content, not its position, so a saved note stays with its finding
  // when the report is rebuilt with findings added, removed or reordered.
  let id = "f" + crypto.createHash("sha1").update([f.level, items.join(","), f.where, f.finding].join("|")).digest("hex").slice(0, 10);
  while (usedIds.has(id)) id += "x";
  usedIds.add(id);
  return { id, order: i, level: f.level, also: f.also || [], item: items.join(", "),
    short: items.map(it => (info[it] || {}).short || "?").join(" / "), text: f.finding, details: f.impact, where: f.where };
});
// Suggested order: severity first; within a level, more Also entries first; then the order written.
fixes.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || b.also.length - a.also.length || a.order - b.order);

const confirms = checklist.filter(c => c.result === "Unconfirmed").map(c => ({ id: "c" + c.item, item: c.item, short: c.short,
  text: c.criterion, details: "Draft answer: " + (c.note || "(none)") }));
const checks = checklist.filter(c => c.result === "Open" || c.check).map(c => ({ id: "o" + c.item, item: c.item, short: c.short,
  text: c.criterion, details: (c.how ? c.how + ": " : "") + (c.result === "Open" ? c.note || "" : c.check), how: c.how }));

const today = new Date();
const pad = n => String(n).padStart(2, "0");
const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`; // reviewer's local date; year first so file names sort
const shownDate = `${pad(today.getMonth() + 1)}-${pad(today.getDate())}-${today.getFullYear()}`; // mm-dd-yyyy on the page
const slug = R.course.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 4).join("-");
// Never replace an earlier report: a second run on the same day gets -2, then -3, and so on.
const stem = `course-qa-report-${slug}-${date}`;
const taken = b => [".html", ".csv"].some(ext => fs.existsSync(path.resolve(outDir, b + ext)));
let base = stem;
for (let n = 2; taken(base); n++) base = `${stem}-${n}`;
const htmlPath = path.resolve(outDir, base + ".html"), csvPath = path.resolve(outDir, base + ".csv");
let runTime = "";
if (R.startedAt) { const s = Math.max(0, Math.round((today - new Date(R.startedAt)) / 1000));
  runTime = `${Math.floor(s / 60)} min ${s % 60} s`; }

const csvHeader = ["Type", "Rank", "Level", "Also", "Item", "Short name", "Task", "Details", "Where", "Notes"];
const data = {
  meta: { course: R.course, source: example ? path.basename(R.source.replace(/\\/g, "/")).replace(/^[0-9a-f]{8}-/, "").replace(/\s*\(attached in chat\)$/, "") : R.source, date: shownDate, runTime, tokens: R.tokens,
    htmlPath: example ? path.basename(htmlPath) : htmlPath, csvPath: example ? path.basename(csvPath) : csvPath, csvName: base + ".csv",
    reportId: base },
  fixes, confirms, checks, checklist, csvHeader
};

const tpl = fs.readFileSync(path.join(here, "..", "report-template.html"), "utf8");
const json = JSON.stringify(data).replace(/</g, "\\u003c");
// Fonts are embedded so the report works offline and contacts no one.
const font = (file, family, style, weight) => `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(here, "..", "fonts", file)).toString("base64")}) format("woff2");}`;
const fonts = font("fraunces.woff2", "Fraunces", "normal", "600 800") + font("dm-sans.woff2", "DM Sans", "normal", "400 700") + font("dm-sans-italic.woff2", "DM Sans", "italic", "400");
fs.writeFileSync(htmlPath, tpl.replace("/*__FONTS__*/", () => fonts).replace('id="qa-data">__QA_DATA__', () => 'id="qa-data">' + json));

const rows = [csvHeader];
const add = (type, list) => list.forEach((t, i) => rows.push([type, i + 1, t.level || "", (t.also || []).join("; "), t.item, t.short, t.text, t.details || "", t.where || "", ""]));
add("Fix", fixes); add("Confirm", confirms); add("Check", checks);
const cell = c => { c = String(c); return /[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; };
fs.writeFileSync(csvPath, "﻿" + rows.map(r => r.map(cell).join(",")).join("\r\n"));

const count = l => fixes.filter(f => f.level === l).length;
console.log(`HTML: ${htmlPath}`);
console.log(`CSV: ${csvPath}`);
console.log(`Findings: ${fixes.length} (${LEVELS.map(l => `${count(l)} ${l}`).join(", ")}) · Unconfirmed ${confirms.length} · Open ${checks.length}`);
if (problems.length) { console.log("PROBLEMS TO FIX IN review.json, then run again:"); problems.forEach(p => console.log("  " + p)); process.exitCode = 1; }
