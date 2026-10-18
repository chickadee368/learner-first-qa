// Builds docs/checklist.html (the website's checklist page) from the skill's checklist.md, so the two never drift.
// Usage, from the repo folder: node tools/build-checklist-page.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const md = fs.readFileSync(path.join(root, "plugins/learner-first-qa/skills/course-qa/checklist.md"), "utf8");

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = s => esc(s)
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>");
const LEVEL = { Blocked: "blocked", Inaccurate: "inaccurate", Detracts: "detracts", "Adds effort": "effort", "Minor error": "minor" };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const heading = s => s.replace(/\s+[—–]\s+/g, ": "); // "Part 1 — UX" reads "Part 1: UX" on the page

const lines = md.split("\n"), out = [], toc = [];
let i = 0, title = "";
const cells = l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
while (i < lines.length) {
  const l = lines[i];
  if (/^# /.test(l)) { title = l.slice(2).trim(); i++; continue; }
  if (/^---\s*$/.test(l) || !l.trim()) { i++; continue; }
  let m;
  if ((m = l.match(/^(##+) (.+)/))) {
    const text = heading(m[2].trim()), lvl = m[1].length, id = slug(text);
    if (lvl === 2) toc.push([id, text]);
    out.push(`<h${lvl} id="${id}">${inline(text)}</h${lvl}>`); i++; continue;
  }
  if (/^\|/.test(l)) { // table: header, divider, rows
    const head = cells(l); i += 2; const rows = [];
    while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
    const isLevels = head[1] === "Level";
    out.push('<div class="wrap"><table><thead><tr>' + head.map(h => `<th scope="col">${inline(h)}</th>`).join("") + "</tr></thead><tbody>");
    for (const r of rows) {
      const tds = r.map((c, ci) => {
        if (isLevels && ci === 1) { const name = c.replace(/\*/g, ""); return `<td><span class="pill ${LEVEL[name] || ""}">${esc(name)}</span></td>`; }
        if (!isLevels && ci === 1) return `<td><strong>${inline(c)}</strong></td>`;
        return `<td>${inline(c)}</td>`;
      });
      out.push(`<tr${isLevels ? "" : ` id="item-${esc(r[0])}"`}>${tds.join("")}</tr>`);
    }
    out.push("</tbody></table></div>"); continue;
  }
  if (/^- /.test(l)) { // list, with indented continuation lines
    const items = [];
    while (i < lines.length && (/^- /.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
      if (/^- /.test(lines[i])) items.push(lines[i].slice(2).trim()); else items[items.length - 1] += " " + lines[i].trim();
      i++;
    }
    out.push("<ul>" + items.map(t => `<li>${inline(t)}</li>`).join("") + "</ul>"); continue;
  }
  // paragraph: consecutive plain lines
  const para = [];
  while (i < lines.length && lines[i].trim() && !/^(#|\||- |---)/.test(lines[i])) para.push(lines[i++].trim());
  out.push(`<p>${inline(para.join(" "))}</p>`);
}

const nav = (current) => `<header class="site"><div class="inner">
  <a class="brand" href="index.html">Learner-First QA</a>
  <nav class="site" aria-label="Site">
    <a href="index.html">Overview</a>
    <a href="guide.html">Getting started</a>
    <a href="checklist.html" aria-current="page">Checklist</a>
    <a href="sample-report.html">Sample report</a>
    <a href="https://github.com/chickadee368/learner-first-qa">GitHub</a>
  </nav>
</div></header>`;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="The full Learner-First UX/LX Checklist: severity levels, rules, and every criterion with who checks it.">
<link rel="stylesheet" href="site.css">
</head>
<body>
<!-- Generated from checklist.md by tools/build-checklist-page.js. Edit checklist.md, then run the script. -->
<a class="skip" href="#main">Skip to content</a>
${nav()}
<main id="main" class="checklist">
<h1>${esc(title)}</h1>
<p class="toc">${toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join(" · ")}</p>
${out.join("\n")}
</main>
<footer><div class="inner">
  Created by <a href="https://www.linkedin.com/in/chelseataylor">Chelsea Taylor</a>. Checklist under
  <a href="https://github.com/chickadee368/learner-first-qa/blob/main/LICENSE-CONTENT">CC BY 4.0</a>; code under the
  <a href="https://github.com/chickadee368/learner-first-qa/blob/main/LICENSE">MIT License</a>.
  Fonts: Fraunces and DM Sans (SIL Open Font License).
</div></footer>
</body>
</html>
`;
fs.writeFileSync(path.join(root, "docs/checklist.html"), html);
console.log(`docs/checklist.html written: ${toc.length} sections, ${(html.match(/id="item-/g) || []).length} checklist items`);
