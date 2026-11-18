#!/usr/bin/env node
// Сверка экрана с эталоном 1 к 1. Порядок работы: docs/design/v3/PIXEL_QA.md.
// node scripts/ref-check.mjs <home|house|chat|profile> [--spec file.json] [--route /path] [--root selector]
//      [--attr data-ref] [--base http://localhost:3000] [--out dir]
// Элементы размечены data-ref="<id>", id и эталонные x/y/w/h лежат в docs/design/v3/measure/<экран>.json.
// Код выхода 0 — все блоки найдены и отклонение каждого края не больше tolerancePx.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : dflt; };
const screen = argv[0];
if (!screen || screen.startsWith("--")) { console.error("укажи экран: home | house | chat | profile"); process.exit(2); }

const spec = JSON.parse(readFileSync(opt("spec", `docs/design/v3/measure/${screen}.json`), "utf8"));
const base = opt("base", "http://localhost:3000");
const route = opt("route", spec.route);
const root = opt("root", "");
const attr = opt("attr", "data-ref");
const out = opt("out", `.ref-check/${screen}`);
const { width, height } = spec.viewport;
const tol = spec.tolerancePx;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce", locale: "ru-RU" });
await ctx.addInitScript(() => { try { localStorage.setItem("bobr:lang", "ru"); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
await page.goto(base + route, { waitUntil: "networkidle", timeout: 120_000 });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

const found = await page.evaluate(({ attr, root }) => {
  const host = root ? document.querySelector(root) : null;
  const o = host ? host.getBoundingClientRect() : { x: 0, y: 0 };
  const res = {};
  for (const el of (host ?? document).querySelectorAll(`[${attr}]`)) {
    const r = el.getBoundingClientRect();
    res[el.getAttribute(attr)] = { x: r.x - o.x, y: r.y - o.y, w: r.width, h: r.height };
  }
  return { boxes: res, overflow: document.documentElement.scrollWidth - innerWidth };
}, { attr, root });

const pagePng = `${out}/page.png`;
if (root) await page.locator(root).screenshot({ path: pagePng }); else await page.screenshot({ path: pagePng });

const rows = spec.boxes.map((b) => {
  const f = found.boxes[b.id];
  if (!f) return { ...b, miss: true, pass: false };
  const d = { dx: f.x - b.x, dy: f.y - b.y, dw: f.width ?? f.w - b.w, dh: f.h - b.h };
  d.dw = f.w - b.w;
  const worst = Math.max(...Object.values(d).map(Math.abs));
  return { ...b, f, ...d, worst, pass: worst <= tol };
});
const r1 = (n) => (Math.round(n * 10) / 10).toString();
const extra = Object.keys(found.boxes).filter((id) => !spec.boxes.some((b) => b.id === id));
const failed = rows.filter((r) => !r.pass);

// Три панели: эталон, страница, наложение 50 % с рамками блоков (зелёная — в допуске, красная — нет).
const b64 = (p) => readFileSync(p).toString("base64");
const panel = (inner) => `<div style="position:relative;width:${width}px;height:${height}px;overflow:hidden;background:#fff;flex:none">${inner}</div>`;
const img = (src, extra = "") => `<img src="data:image/png;base64,${src}" style="position:absolute;inset:0;width:${width}px;height:${height}px;${extra}">`;
const ref = b64(spec.ref), cur = b64(pagePng);
const frames = rows.map((r) => `<div style="position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;outline:1px solid ${r.pass ? "#16a34a" : "#dc2626"}"></div>`).join("");
const sheet = await ctx.newPage();
await sheet.setViewportSize({ width: width * 3 + 40, height: height });
await sheet.setContent(`<body style="margin:0;display:flex;gap:20px;background:#222">${panel(img(ref))}${panel(img(cur))}${panel(img(ref) + img(cur, "opacity:.5") + frames)}</body>`);
await sheet.screenshot({ path: `${out}/compare.png` });
await browser.close();

const md = [
  `# ${screen}: сверка с эталоном`, "",
  `Маршрут \`${route}\`, кадр ${width}×${height}, допуск ±${tol} px. Прошло ${rows.length - failed.length} из ${rows.length}.`, "",
  "| Блок | Эталон x,y,w,h | Страница x,y,w,h | Δx | Δy | Δw | Δh | Итог |", "|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => r.miss
    ? `| ${r.id} | ${r.x},${r.y},${r.w},${r.h} | нет на странице | | | | | FAIL |`
    : `| ${r.id} | ${r.x},${r.y},${r.w},${r.h} | ${r1(r.f.x)},${r1(r.f.y)},${r1(r.f.w)},${r1(r.f.h)} | ${r1(r.dx)} | ${r1(r.dy)} | ${r1(r.dw)} | ${r1(r.dh)} | ${r.pass ? "PASS" : "FAIL"} |`),
  "", `Горизонтальное переполнение: ${found.overflow} px. Ошибки консоли: ${errors.length ? errors.join(" · ") : "нет"}.`,
  extra.length ? `Размечено, но нет в эталоне: ${extra.join(", ")}.` : "",
].join("\n");
writeFileSync(`${out}/report.md`, md + "\n");

console.log(`${screen}: ${rows.length - failed.length}/${rows.length} в допуске ±${tol}px, overflow ${found.overflow}, ошибок консоли ${errors.length}`);
for (const r of failed) console.log(r.miss ? `  нет блока ${r.id}` : `  ${r.id}: Δx ${r1(r.dx)} Δy ${r1(r.dy)} Δw ${r1(r.dw)} Δh ${r1(r.dh)}`);
console.log(`отчёт ${out}/report.md, снимок ${out}/compare.png`);
process.exit(failed.length || found.overflow > 0 || errors.length ? 1 : 0);
