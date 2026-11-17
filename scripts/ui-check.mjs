#!/usr/bin/env node
// ui-check: живой снимок страницы Bobr — доказательство для UI-правки. Перенесено из Mentorium-Platform
// (frontend/scripts/ui-check.mjs): ловит console error / pageerror / ответы >= 400, горизонтальный
// оверфлоу, кнопки за краем (CLIPPED → код 1) и обрезанный текст (TRUNC — предупреждение).
//
// node scripts/ui-check.mjs [route] [--lang uz|ru] [--viewports desktop,phone] [--wait selector]
//        [--boxes 'sel1,sel2'] [--reduced-motion] [--full] [--out dir] [--base http://localhost:3000]
//
// Dev-сервер должен быть поднят (`npm run dev`). Снимки → --out (по умолчанию .ui-check/<route>/).
// Холст, который возят пальцем, пометь data-ui-check-skip — его кнопки за краем не считаются.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : dflt; };
const flag = (name) => argv.includes(`--${name}`);
const path = argv[0] && !argv[0].startsWith("--") ? argv[0] : "/";
const BASE = opt("base", "http://localhost:3000");
const lang = opt("lang", "uz");
const waitFor = opt("wait", "");
const boxes = opt("boxes", "");
const out = opt("out", `.ui-check/${path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root"}-${lang}`);
mkdirSync(out, { recursive: true });

// name -> [width, height, touch]. desktop и phone — по умолчанию (DESIGN.md: 1280 и 390).
const VIEWPORTS = {
  desktop: [1280, 800, false], phone: [390, 844, true],
  laptop: [1366, 768, false], tablet: [768, 1024, true], "tablet-l": [1024, 768, true],
  "phone-l": [844, 390, true], "phone-sm": [360, 740, true],
};
const wanted = opt("viewports", "desktop,phone").split(",").map((s) => s.trim()).filter(Boolean);
const unknown = wanted.filter((n) => !VIEWPORTS[n]);
if (unknown.length) { console.error(`нет вьюпорта ${unknown.join(",")}; есть: ${Object.keys(VIEWPORTS).join(", ")}`); process.exit(2); }

const browser = await chromium.launch();
let bad = 0;
for (const [name, vp] of wanted.map((n) => [n, { width: VIEWPORTS[n][0], height: VIEWPORTS[n][1] }])) {
  const touch = VIEWPORTS[name][2];
  const ctx = await browser.newContext({
    viewport: vp, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch,
    locale: lang === "ru" ? "ru-RU" : "uz-Latn-UZ",
    reducedMotion: flag("reduced-motion") ? "reduce" : "no-preference",
  });
  // TODO(i18n): когда появится выбор языка, ставить его здесь тем же ключом, что и продукт.
  await ctx.addInitScript((l) => { try { localStorage.setItem("bobr:lang", l); } catch {} }, lang);
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text().slice(0, 200)));
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 200)));
  page.on("response", (r) => r.status() >= 400 && errs.push(`http ${r.status()} ${r.url().slice(0, 120)}`));
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 15000 });
  // Шрифты и пружины успевают встать: снимок не ловит кадр середины анимации.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const landed = new URL(page.url()).pathname;
  const asked = new URL(BASE + path).pathname;
  if (landed.replace(/\/$/, "") !== asked.replace(/\/$/, "")) errs.push(`redirect: запрошен ${asked}, открылся ${landed}`);
  const m = await page.evaluate(() => ({ iw: innerWidth, sw: document.documentElement.scrollWidth }));
  const shot = `${out}/${name}.png`;
  await page.screenshot({ path: shot, fullPage: flag("full") });
  const overflow = m.sw > m.iw;
  // Кнопки и ссылки, выходящие за край окна или за край предка с overflow: hidden|clip (обрезаны). Внутри боковой
  // прокрутки (overflow-x: auto|scroll — карусель) и холст с [data-ui-check-skip] и в невидимых панелях (opacity 0 / visibility hidden /
  // display none / нулевой размер) не считаем.
  const clipped = await page.evaluate(() => {
    const iw = innerWidth, res = [];
    for (const el of document.querySelectorAll("button, a[href], [role=button], input, select, textarea")) {
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      if (el.closest("[data-ui-check-skip]")) continue; // холст, который возят пальцем (карта махалли)
      let hidden = false, scroller = false, cut = b.left < -1 || b.right > iw + 1;
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const c = getComputedStyle(n);
        if (c.visibility === "hidden" || c.display === "none" || +c.opacity === 0) { hidden = true; break; }
        // закрытое выезжающее меню (off-canvas): предок целиком за левым/правым краем окна — не обрезка, его просто не видно
        if (n !== el) { const o = n.getBoundingClientRect(); if (o.width > 0 && (o.right <= 1 || o.left >= iw - 1)) { hidden = true; break; } }
        if (n === el) continue;
        if (c.overflowX === "auto" || c.overflowX === "scroll") { scroller = true; break; }
        if (c.overflowX === "hidden" || c.overflowX === "clip") {
          const a = n.getBoundingClientRect();
          if (b.right > a.right + 2 || b.left < a.left - 2) cut = true;
        }
      }
      if (cut && !hidden && !scroller) res.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}" x ${Math.round(b.left)}..${Math.round(b.right)}`);
    }
    return res;
  });
  // Предупреждение (код выхода не меняет): текст, обрезанный внутри блока — overflow hidden|clip и scrollWidth > clientWidth
  // (многоточие или срез края). Не ловится CLIPPED, потому что сам блок целиком в окне.
  const trunc = await page.evaluate(() => {
    const res = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest("[data-ui-check-skip]") || !el.childNodes.length) continue;
      const c = getComputedStyle(el);
      if (c.display === "none" || c.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
      const name = `<${el.tagName.toLowerCase()}> "${el.textContent.trim().slice(0, 40)}"`;
      // подпись шире своей кнопки/ссылки (nowrap без места): «ПЕРЕЙТИ К ДОМАШНЕМУ ЗАДАНИЮ» торчала за плашку, а у кнопки overflow visible —
      // обрезки нет, поэтому ни CLIPPED, ни проверка ниже её не видели
      if (el.matches("button, a[href], [role=button]") && el.textContent.trim()) {
        // только обычный видимый текст: подпись «для экрана чтения» (1×1, clip-path) и значки-бейджи (position: absolute) — не в счёт
        let tl = Infinity, tr2 = -Infinity;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let tn = walker.nextNode(); tn; tn = walker.nextNode()) {
          if (!tn.textContent.trim()) continue;
          let skip = false;
          for (let a = tn.parentElement; a && a !== el.parentElement; a = a.parentElement) {
            const ca = getComputedStyle(a), ra = a.getBoundingClientRect();
            if (ca.display === "none" || ca.visibility === "hidden" || ra.width <= 2 || ra.height <= 2 || ca.clipPath !== "none"
              || (a !== el && (ca.position === "absolute" || ca.position === "fixed"))) { skip = true; break; }
          }
          if (skip) continue;
          const rgb = document.createRange();
          rgb.selectNodeContents(tn);
          const tb = rgb.getBoundingClientRect();
          if (tb.width > 0) { tl = Math.min(tl, tb.left); tr2 = Math.max(tr2, tb.right); }
        }
        if (tl !== Infinity && (tr2 > r.right + 2 || tl < r.left - 2)) {
          res.push(`${name} текст шире кнопки x ${Math.round(tl)}..${Math.round(tr2)} при ${Math.round(r.left)}..${Math.round(r.right)}`);
          continue;
        }
      }
      // многострочная обрезка: -webkit-line-clamp или высота с overflow hidden|clip — scrollHeight больше видимого
      const clampedY = (c.overflowY === "hidden" || c.overflowY === "clip") && el.textContent.trim() && el.scrollHeight > el.clientHeight + 4
        && (c.webkitLineClamp !== "none" || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      if (clampedY) { res.push(`${name} ${el.clientHeight}h<${el.scrollHeight}h`); continue; }
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) continue;
      // текст (его собственный прямоугольник), вылезающий за границы предка с overflow hidden|clip: число «416» срезано краем плитки
      {
        const rg = document.createRange();
        rg.selectNodeContents(el);
        const tr = rg.getBoundingClientRect();
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const ca = getComputedStyle(a);
          const hx = ca.overflowX === "hidden" || ca.overflowX === "clip";
          if (!hx) continue;
          const ar = a.getBoundingClientRect();
          const partRight = tr.right > ar.right + 2 && tr.left < ar.right, partLeft = tr.left < ar.left - 2 && tr.right > ar.left; // целиком снаружи — скрыто (закрытое меню), не обрезка
          if (partRight || partLeft) {
            res.push(`${name} вылезает за <${a.tagName.toLowerCase()}.${String(a.className).split(" ")[0]}> x ${Math.round(tr.left)}..${Math.round(tr.right)} при ${Math.round(ar.left)}..${Math.round(ar.right)}`);
            break;
          }
        }
      }
      if (c.overflowX !== "hidden" && c.overflowX !== "clip" && c.textOverflow !== "ellipsis") continue;
      if (el.scrollWidth > el.clientWidth + 1) res.push(`${name} ${el.clientWidth}<${el.scrollWidth}`);
    }
    return res;
  });
  if (errs.length || overflow || clipped.length || m.iw !== vp.width) bad++;
  console.log(`${name} ${vp.width}x${vp.height}${touch ? " touch" : ""}: ${shot} | ${overflow ? `H-OVERFLOW ${m.sw}px` : "без гориз. оверфлоу"} | CLIPPED: ${clipped.length} | TRUNC: ${trunc.length} | ошибок: ${errs.length}`);
  clipped.slice(0, 10).forEach((c) => console.log("    clipped:", c));
  trunc.slice(0, 10).forEach((c) => console.log("    TRUNC (предупреждение):", c));
  errs.slice(0, 10).forEach((e) => console.log("   ", e));
  if (boxes) {
    for (const sel of boxes.split(",").map((s) => s.trim()).filter(Boolean)) {
      const r = await page.$eval(sel, (el) => { const b = el.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; }).catch(() => null);
      const pct = (v) => ((v / vp.width) * 100).toFixed(1);
      console.log(`    ${sel}: ${r ? `x ${pct(r[0])}% y ${pct(r[1])}% w ${pct(r[2])}% h ${pct(r[3])}% (от ширины)` : "НЕ НАЙДЕН"}`);
    }
  }
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
