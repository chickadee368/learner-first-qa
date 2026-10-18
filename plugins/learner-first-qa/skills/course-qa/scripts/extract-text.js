// Pulls what a learner sees and hears out of an extracted course, in page order, as plain text.
// Usage: node extract-text.js <extracted-folder> <output.txt>
// Handles HTML course exports that keep their content in course-data.js, and PowerPoint decks (a .pptx extracted like a zip).
// Prints the format, the start time, the text size and a token estimate for the review.
const fs = require("fs"), path = require("path");
const [dir, out] = process.argv.slice(2);
const startedAt = new Date().toISOString();
const lines = [];
const say = s => lines.push(s);

const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8594;/g, "->")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const decodeXml = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

let format;
if (fs.existsSync(path.join(dir, "course-data.js"))) { format = "HTML course export"; courseData(); }
else if (fs.existsSync(path.join(dir, "ppt", "presentation.xml"))) { format = "PowerPoint"; pptx(); }
else {
  format = "unknown";
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
    fs.statSync(p).isDirectory() ? walk(p) : files.push(path.relative(dir, p)); } })(dir);
  say("Unknown format. Read these files directly:");
  files.filter(f => /\.(html|json|js|xml|vtt|srt|txt|md)$/i.test(f) && !/fonts?|vendor|lib/i.test(f)).forEach(f => say("  " + f));
}

// ---------- HTML course export (course-data.js) ----------
function courseData() {
  const m = fs.readFileSync(path.join(dir, "course-data.js"), "utf8").match(/courseData\s*=\s*"([^"]+)"/);
  const j = JSON.parse(Buffer.from(m[1], "base64").toString("utf8"));
  const c = j.courseContent;
  const doc = n => { if (!n) return ""; if (typeof n === "string") return n; if (Array.isArray(n)) return n.map(doc).join("");
    if (n.type === "text") { const link = (n.marks || []).find(x => x.type === "link");
      const bold = (n.marks || []).some(x => x.type === "bold");
      let t = bold ? `**${n.text}**` : n.text; return link ? `[${t}](${link.attrs.href})` : t; }
    const inner = doc(n.content);
    if (n.type === "heading") return `\n[H${n.attrs && n.attrs.level}] ${inner}\n`;
    if (n.type === "display") return `\n[display] ${inner}\n`;
    if (n.type === "paragraph") return inner + "\n";
    if (n.type === "listItem") return "- " + inner;
    if (n.type === "hardBreak") return " / ";
    return inner; };
  // These exports store most text as rich-text documents, some wrapped in { data: ... }, some as plain strings.
  const txt = v => { if (v == null) return ""; if (typeof v !== "object") return String(v);
    if (v.type === "doc" || v.content) return doc(v).trim().replace(/\n{2,}/g, "\n"); if (v.data) return txt(v.data); return ""; };
  const t = c.theme || {};
  say(`COURSE: ${c.title}`);
  say(`Headline: ${txt(c.headline && c.headline.data)}`);
  say(`Description: ${txt(c.description && c.description.data)}`);
  say(`THEME: page ${t.pageColor} · body ${t.bodyColor} · header ${t.headerColor} · accent ${t.accentColor} · secondary ${t.secondaryAccentColor} · title overlay ${t.titleOverlay} · card ${t.styleTokens && t.styleTokens.cardBackground} · extra accents ${((t.additionalAccentColors || {}).accents || []).map(a => a.color).join(", ")}`);
  if (c.headerImage) say(`Header image alt: ${c.headerImage.altText}`);
  const s = c.settings || {};
  say("ROW BACKGROUNDS: tiles indented under a \"ROW n background\" line sit on that color, not the page color. The player may switch text to white on dark rows, so test both the theme body color and white against it. Tiles under a \"background PHOTO\" line sit on that photo (and its overlay), so their contrast can only be checked on screen.");
  say(`SETTINGS: navigation ${s.navigationFreedom} · completion ${s.completionCriteria} · passing ${s.passingPercentage}% · retries ${s.assessmentRetries} · narration autoplay ${s.narrationAutoplay}`);
  const cb = Object.values(c.blocks || {});
  cb.filter(b => b.type === "objective").forEach(b => say(`Course objective: ${b.data.text}`));
  cb.filter(b => b.type === "resource").forEach(b => say(`Resource (not in export): ${b.data.title}`));
  const items = Object.values(c.courseItems || {}).sort((a, b) => a.order.localeCompare(b.order));
  for (const it of items) {
    const l = Object.values(j.lessonContents).find(x => x.id === it.lessonId) || {};
    const B = l.blocks || {};
    say(`\n================ LESSON: ${it.title}`);
    say(`Pages: ${(l.blockOrder || []).length}`);
    Object.values(B).filter(b => b.type === "objective").forEach(b => say(`Lesson objective: ${b.data.text}`));
    const kids = id => Object.entries(B).filter(([, b]) => b.parentId === id).sort((a, b) => (a[1].order || "").localeCompare(b[1].order || ""));
    const img = (i, ind) => i && say(`${ind}IMAGE alt: "${i.altText || "(none)"}"`);
    const show = (id, ind) => {
      const b = B[id]; if (!b) return; const d = b.data || {};
      const color = d.textColor || d.backgroundColor ? ` (${d.textColor ? "text " + d.textColor : "theme text color"}${d.backgroundColor ? " on " + d.backgroundColor : ""})` : "";
      switch (b.type) {
        case "textTile": say(`${ind}TEXT${color}: ${txt(d.text)}`); break;
        case "listTile": say(`${ind}LIST (${d.mode}):`); (d.items || []).forEach(x => say(`${ind}  - ${txt(x.text)}`)); break;
        case "quoteTile": say(`${ind}QUOTE: "${txt(d.quote)}" (${txt(d.attribution)})`); break;
        case "imageTile": case "imageAsset": img(d.image, ind); break;
        case "timelineTile": say(`${ind}TIMELINE:`); (d.events || []).forEach(e => say(`${ind}  ${e.date}: ${txt(e.content)}`)); break;
        case "transitionTile": case "characterAsset": break;
        case "shortAnswerTile": say(`${ind}SHORT ANSWER (graded ${d.graded}, counts ${d.contributingToScore}): ${txt(d.question)}`); break;
        case "matchingTile": say(`${ind}MATCHING (counts ${d.contributingToScore}, no feedback field):`); (d.items || []).forEach(x => say(`${ind}  ${txt(x.choice)} => ${txt(x.match)}`)); break;
        case "rankingTile": say(`${ind}ORDERING (graded ${d.graded}, counts ${d.contributingToScore}, feedback "${txt(d.feedback)}"): ${txt(d.question)}`); (d.items || []).forEach((x, i) => say(`${ind}  ${i + 1}. ${txt(x.text)}`)); break;
        case "sortingTile": say(`${ind}SORTING (immediate feedback ${d.immediateFeedback}): ${txt(d.question)}`); (d.categories || []).forEach(k => say(`${ind}  [${txt(k.content)}] ${(k.items || []).map(x => txt(x.content)).join(" | ")}`)); break;
        case "questionTile": say(`${ind}QUESTION (graded ${d.graded}, counts ${d.contributingToScore}, feedback ${d.feedbackMode}): ${txt(d.question)}`);
          (d.options || []).forEach((o, i) => say(`${ind}  ${String.fromCharCode(65 + i)}. ${o.correct ? "[correct] " : ""}${txt(o.text)} -> feedback: ${txt(o.feedback) || "(none)"}`)); break;
        case "editableVideoTile": say(`${ind}VIDEO (narrated scenes, built at playback):`); break;
        case "videoScene": say(`${ind}SCENE on-screen: ${strip(d.body || "")}${d.textColor ? ` (text ${d.textColor} on ${(d.background || {}).baseColor})` : ""}`);
          (d.transcript || []).forEach(tr => say(`${ind}  narration: ${(tr.text || []).filter(x => x.type === "text").map(x => x.text).join("")}`)); break;
        case "experienceTile": say(`${ind}SCENARIO:`); break;
        case "choiceNode": img(d.backgroundImage, ind + "  ");
          say(`${ind}NODE ${id}: ${txt(d.text)}`); (d.options || []).forEach(o => say(`${ind}  option: ${txt(o.text)} -> ${o.next.type === "complete" ? "END" : o.next.id}`)); break;
        default: say(`${ind}${b.type}: ${JSON.stringify(d).slice(0, 300)}`);
      }
      for (const [k] of kids(id)) show(k, ind + "  ");
    };
    (l.blockOrder || []).forEach((pid, i) => { const p = B[pid];
      say(`\n---- PAGE ${i + 1}: ${p.title || ""}`);
      // A row can have its own background color; the tiles in it sit on that color, not the page color.
      if (p.layout) p.layout.rows.forEach((r, ri) => {
        if (r.backgroundColor) say(`  ROW ${ri + 1} background ${r.backgroundColor}`);
        const bi = r.backgroundImage;
        if (bi) say(`  ROW ${ri + 1} background PHOTO (${bi.layout || "full"})${r.overlayColor ? " with overlay " + r.overlayColor : ""} · alt: "${bi.altText || "(none)"}"`);
        for (const tl of r.tiles) show(tl.tileId, r.backgroundColor || bi ? "    " : "  ");
      }); else show(pid, "  ");
    });
  }
  // Video scene text colors (for contrast). Each color + background pair is listed once, with every size it is used at.
  const pairs = new Map();
  for (const l of Object.values(j.lessonContents)) for (const b of Object.values(l.blocks || {})) {
    const css = ((b.data && typeof b.data.body === "string" && b.data.body.match(/<style>([\s\S]*?)<\/style>/)) || [])[1] || "";
    for (const r of css.split("}")) { const col = r.match(/(?:^|[;{])color:\s*([^;]+)/), bg = r.match(/background:\s*([^;]+)/), fs_ = r.match(/font-size:\s*([^;]+)/);
      if (!col) continue;
      const key = `color ${col[1].trim()}${bg ? " on " + bg[1].trim() : ""}`;
      const p = pairs.get(key) || { sizes: new Set(), styles: 0 }; p.styles++; if (fs_) p.sizes.add(fs_[1].trim()); pairs.set(key, p); }
  }
  if (pairs.size) { say("\nVIDEO TEXT STYLES (scene background is cream #FDF6EC unless a pair says otherwise; canvas is ~1920px wide, shown scaled down):");
    for (const [key, p] of pairs) { const sizes = [...p.sizes].sort((a, b) => parseFloat(a) - parseFloat(b));
      say(`  ${key}${sizes.length ? " · sizes " + sizes.join(", ") : ""} (${p.styles} ${p.styles === 1 ? "style" : "styles"})`); } }
}

// ---------- PowerPoint ----------
function pptx() {
  const read = p => { const f = path.join(dir, p); return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : ""; };
  const relsOf = p => { const r = read(path.join(path.dirname(p), "_rels", path.basename(p) + ".rels")); const m = {};
    for (const x of r.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) m[x[1]] = path.posix.normalize(path.posix.join(path.posix.dirname(p), x[2]));
    for (const x of r.matchAll(/<Relationship [^>]*Target="([^"]+)"[^>]*Id="([^"]+)"/g)) m[x[2]] = path.posix.normalize(path.posix.join(path.posix.dirname(p), x[1]));
    return m; };
  const pres = read("ppt/presentation.xml");
  const presRels = relsOf("ppt/presentation.xml");
  const slideIds = [...pres.matchAll(/<p:sldId [^>]*r:id="([^"]+)"/g)].map(m => presRels[m[1]]);
  const size = pres.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/);
  const core = read("docProps/core.xml"); const title = (core.match(/<dc:title>([^<]*)/) || [])[1];
  say(`DECK: ${title || "(no title in file properties)"} · ${slideIds.length} slides`);
  const theme = read("ppt/theme/theme1.xml");
  const tc = {}; for (const k of ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink"]) {
    const m = theme.match(new RegExp(`<a:${k}>[\\s\\S]*?(?:srgbClr val="([0-9A-Fa-f]{6})"|lastClr="([0-9A-Fa-f]{6})")`)); if (m) tc[k] = "#" + (m[1] || m[2]); }
  say(`THEME COLORS: ${Object.entries(tc).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  const fonts = theme.match(/<a:majorFont>\s*<a:latin typeface="([^"]*)"[\s\S]*?<a:minorFont>\s*<a:latin typeface="([^"]*)"/);
  if (fonts) say(`THEME FONTS: headings ${fonts[1]} · body ${fonts[2]}`);
  slideIds.forEach((sp, i) => {
    const x = read(sp), rels = relsOf(sp);
    const layoutPath = Object.values(rels).find(p => /slideLayouts\//.test(p));
    const layout = layoutPath ? decodeXml((read(layoutPath).match(/<p:cSld name="([^"]*)"/) || [])[1] || "?") : "?";
    const hidden = /<p:sld [^>]*show="0"/.test(x) ? " · HIDDEN" : "";
    const bgBlock = (x.match(/<p:bg>([\s\S]*?)<\/p:bg>/) || [])[1] || "";
    const bgm = bgBlock.match(/<a:(?:srgbClr val="([0-9A-Fa-f]{6})"|schemeClr val="([a-z0-9]+)")/) || [];
    const bg = bgm[1] || bgm[2]; // hex, or a scheme name like bg1 (see THEME COLORS); none = the layout's background
    say(`\n---- SLIDE ${i + 1} · layout "${layout}"${hidden}${bg ? " · background " + (/^[0-9A-Fa-f]{6}$/.test(bg) ? "#" + bg : bg) : ""}`);
    let hasTitle = false; let n = 0;
    // Shapes in file order = screen reader reading order.
    for (const m of x.matchAll(/<p:(sp|pic|graphicFrame)>([\s\S]*?)<\/p:\1>/g)) {
      const kind = m[1], s = m[2]; n++;
      const nv = s.match(/<p:cNvPr [^>]*>/); const name = nv ? decodeXml((nv[0].match(/name="([^"]*)"/) || [])[1] || "") : "";
      const descr = nv ? (nv[0].match(/descr="([^"]*)"/) || [])[1] : undefined;
      const decorative = /adec:decorative[^>]*val="1"/.test(s);
      const ph = (s.match(/<p:ph(?: [^>]*)?\/?>/) || [])[0]; const phType = ph ? ((ph.match(/type="([^"]*)"/) || [])[1] || "body") : null;
      const off = s.match(/<a:off x="(\d+)" y="(\d+)"/);
      const pos = off && size ? ` @ ${Math.round(off[1] / size[1] * 100)}% across, ${Math.round(off[2] / size[2] * 100)}% down` : "";
      if (phType === "title" || phType === "ctrTitle") hasTitle = true;
      const paras = [...s.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map(p => [...p[1].replace(/<a:br\b[^>]*?(?:\/>|>[\s\S]*?<\/a:br>)/g, "<a:t> / </a:t>")
        .matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(t => decodeXml(t[1])).join("")).filter(Boolean);
      const colors = [...new Set([...s.matchAll(/<a:rPr[^>]*>[\s\S]*?<a:solidFill>\s*<a:(?:srgbClr val="([0-9A-Fa-f]{6})"|schemeClr val="([a-z0-9]+)")/g)].map(c => c[1] ? "#" + c[1] : c[2]))];
      const spPr = (s.match(/<p:spPr[^>]*>([\s\S]*?)<\/p:spPr>/) || [])[1] || "";
      const fill = (spPr.replace(/<a:ln[\s\S]*?<\/a:ln>/g, "").match(/<a:solidFill>\s*<a:(?:srgbClr val="([0-9A-Fa-f]{6})"|schemeClr val="([a-z0-9]+)")/) || []);
      // No fill in the shape's own properties? Then its style's fillRef decides it (unless set to no fill).
      const styleFill = /<a:noFill\/>/.test(spPr) ? [] : ((s.match(/<a:fillRef idx="[1-9]\d*">\s*<a:(?:srgbClr val="([0-9A-Fa-f]{6})"|schemeClr val="([a-z0-9]+)")/) || []));
      const fillTxt = fill[1] ? "#" + fill[1] : fill[2] || (styleFill[1] ? "#" + styleFill[1] : styleFill[2]);
      const sizes = [...new Set([...s.matchAll(/<a:rPr[^>]*sz="(\d+)"/g)].map(z => z[1] / 100 + "pt"))];
      let head = `  ${n}. ${kind === "pic" ? (/<a:videoFile/.test(s) ? "VIDEO" : /<a:audioFile/.test(s) ? "AUDIO" : "PICTURE") : kind === "graphicFrame" ? (/<a:tbl>/.test(s) ? "TABLE" : "CHART/OBJECT") : "SHAPE"} "${name}"${phType ? ` [placeholder: ${phType}]` : ""}${pos}`;
      if (kind !== "sp" || descr !== undefined) head += ` · alt: ${decorative ? "(marked decorative)" : descr ? `"${decodeXml(descr)}"` : "(none)"}`;
      if (colors.length) head += ` · text colors ${colors.join(", ")}`;
      if (fillTxt) head += ` · fill ${fillTxt}`;
      if (sizes.length) head += ` · sizes ${sizes.join(", ")}`;
      if (/<a:tbl>/.test(s)) head += /firstRow="1"/.test(s) ? " · header row on" : " · header row OFF";
      say(head);
      paras.forEach(p => say(`       ${p}`));
      // Charts and SmartArt keep their text in separate parts of the file.
      const texts = xml => [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(t => decodeXml(t[1]).trim()).filter(Boolean);
      const chartId = (s.match(/<c:chart [^>]*r:id="([^"]+)"/) || [])[1];
      if (chartId && rels[chartId]) {
        const c = read(rels[chartId]);
        const title = texts((c.match(/<c:title>([\s\S]*?)<\/c:title>/) || [])[1] || "").join(" ");
        const series = [...c.matchAll(/<c:ser>[\s\S]*?<c:tx>[\s\S]*?<c:v>([^<]*)<\/c:v>/g)].map(m => decodeXml(m[1]));
        const cats = [...new Set([...c.matchAll(/<c:cat>([\s\S]*?)<\/c:cat>/g)].flatMap(m => [...m[1].matchAll(/<c:v>([^<]*)<\/c:v>/g)].map(v => decodeXml(v[1]))))];
        const type = (c.match(/<c:(\w+)Chart>/) || [])[1];
        say(`       chart${type ? " (" + type + ")" : ""}: title "${title || "(none)"}"${series.length ? " · series: " + series.join(", ") : ""}${cats.length ? " · categories: " + cats.join(", ") : ""}`);
      }
      const dataId = (s.match(/r:dm="([^"]+)"/) || [])[1];
      if (dataId && rels[dataId]) say(`       SmartArt text: ${texts(read(rels[dataId])).join(" | ") || "(none)"}`);
      for (const h of s.matchAll(/<a:hlinkClick [^>]*r:id="([^"]+)"/g)) { const r = read(path.join(path.dirname(sp), "_rels", path.basename(sp) + ".rels"));
        const t = (r.match(new RegExp(`Id="${h[1]}"[^>]*Target="([^"]+)"`)) || r.match(new RegExp(`Target="([^"]+)"[^>]*Id="${h[1]}"`)) || [])[1]; if (t) say(`       link: ${t}`); }
    }
    if (!hasTitle) say("  (no title placeholder on this slide)");
    const notesPath = Object.values(rels).find(p => /notesSlides\//.test(p));
    if (notesPath) { const nt = [...read(notesPath).matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(t => decodeXml(t[1])).join(" ").trim();
      if (nt) say(`  SPEAKER NOTES: ${nt}`); }
    const media = [...new Set(Object.values(rels).filter(p => /media\/.*\.(mp4|mov|wmv|mp3|wav|m4a)$/i.test(p)))]; // each video is linked twice
    media.forEach(mp => say(`  MEDIA: ${mp} (check captions)`));
  });
}

const text = lines.join("\n");
fs.writeFileSync(out, text);
const words = text.split(/\s+/).filter(w => /[a-z]/i.test(w)).length;
// Estimate: reading this text (~3.5 characters per token) + a fixed cost for the skill, checklist, checks and report data.
const estimate = Math.round((text.length / 3.5 + 30000) / 5000) * 5000;
console.log(`FORMAT: ${format}`);
console.log(`STARTED: ${startedAt}`);
console.log(`TEXT: ${out} · ${words.toLocaleString()} words · ${text.length.toLocaleString()} characters`);
console.log(`ESTIMATE: about ${Math.round(estimate / 1000)}k tokens for the review`);
// The exact line to send the reviewer, so it never has to be composed (or skipped).
const roundWords = words < 1000 ? words : Math.round(words / 100) * 100;
const line = `This course has about ${roundWords.toLocaleString("en-US")} words. The review will use about ${Math.round(estimate / 1000)}k tokens.`;
console.log(`SAY (Claude Code): ${line} Press Esc to stop.`);
console.log(`SAY (desktop app or claude.ai): ${line} Click stop to cancel.`);
