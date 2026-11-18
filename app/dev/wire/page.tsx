// Серый макет главного экрана и карты (реф docs/design/refs/app-home-map.webp, план docs/design/v2/WIRE_PLAN.md).
// Только геометрия: координаты в px кадра 390×844 и 1280×800, снятые с рефа. Подписи — роль блока, не тексты продукта.
import { notFound } from "next/navigation";

type Box = { id: string; t?: string; x: number; y: number; w: number; h: number; r?: number; s?: 1 | 2 | 3; own?: boolean };

const SHADE = { 1: 16, 2: 30, 3: 48 } as const;

const circle = (id: string, t: string, x: number, y: number, d: number, s: Box["s"] = 2, own = false): Box =>
  ({ id, t, x, y, w: d, h: d, r: d / 2, s, own });

const HOME: Box[] = [
  { id: "ai", t: "плашка ИИ", x: 11, y: 12, w: 190, h: 26, r: 13, s: 2, own: true },
  { id: "lang", t: "UZ/RU", x: 318, y: 12, w: 60, h: 26, r: 13, s: 2, own: true },
  { id: "greet", t: "Привет + Bobr", x: 95, y: 50, w: 200, h: 35, r: 8, s: 3 },
  circle("cat1", "Ustoz", 28, 113, 74), circle("cat2", "Bobr", 115, 113, 74),
  circle("cat3", "Мой путь", 201, 113, 74), circle("cat4", "Научи", 288, 113, 74),
  { id: "hero", x: 11, y: 234, w: 367, h: 243, r: 40, s: 1 },
  { id: "heroTitle", t: "тема урока", x: 32, y: 259, w: 150, h: 22, r: 6, s: 3 },
  { id: "heroProgress", t: "прогресс", x: 32, y: 293, w: 98, h: 39, r: 20, s: 3 },
  circle("heroGo", "→", 303, 252, 56, 3),
  { id: "heroArt", t: "баннер: Bobr строит плотину", x: 92, y: 345, w: 286, h: 132, r: 24, s: 2 },
  { id: "section", t: "заголовок секции", x: 26, y: 506, w: 228, h: 22, r: 6, s: 3 },
  { id: "card1", x: 11, y: 547, w: 367, h: 107, r: 30, s: 1 },
  { id: "card1Text", t: "чат с Ustoz", x: 32, y: 581, w: 130, h: 36, r: 6, s: 3 },
  { id: "card1Art", t: "баннер", x: 236, y: 552, w: 138, h: 100, r: 20, s: 2 },
  { id: "card2", x: 11, y: 665, w: 367, h: 110, r: 30, s: 1 },
  { id: "card2Text", t: "болтать с Bobr", x: 32, y: 699, w: 130, h: 36, r: 6, s: 3 },
  { id: "card2Art", t: "баннер", x: 262, y: 672, w: 112, h: 92, r: 20, s: 2 },
  { id: "navBar", x: 11, y: 770, w: 367, h: 62, r: 31, s: 2, own: true },
  circle("navHome", "дом", 20, 752, 83, 3),
  circle("nav2", "", 116, 780, 26), circle("nav3", "", 182, 780, 26),
  circle("nav4", "", 248, 780, 26), circle("nav5", "", 314, 780, 26),
];

const MAP: Box[] = [
  circle("back", "←", 21, 26, 64, 3),
  { id: "title", t: "Махалля", x: 102, y: 27, w: 187, h: 64, r: 32, s: 3 },
  circle("more", "···", 305, 26, 64, 3),
  { id: "stats", t: "тем у Bobr · шкала уровня", x: 21, y: 107, w: 348, h: 48, r: 24, s: 2 },
  { id: "ai", t: "плашка ИИ", x: 100, y: 164, w: 190, h: 26, r: 13, s: 2, own: true },
  { id: "island", t: "остров-махалля", x: 0, y: 270, w: 390, h: 505, r: 28, s: 1 },
  { id: "myHouse", t: "мой дом", x: 85, y: 330, w: 150, h: 160, r: 16, s: 3 },
  { id: "plot1", t: "участок", x: 18, y: 505, w: 96, h: 74, r: 12, s: 2, own: true },
  { id: "plot2", t: "участок", x: 262, y: 350, w: 96, h: 74, r: 12, s: 2, own: true },
  { id: "plot3", t: "участок", x: 120, y: 560, w: 80, h: 62, r: 12, s: 2, own: true },
  circle("n1", "1", 200, 638, 44, 3), circle("n2", "2", 268, 605, 44, 3), circle("n3", "3", 331, 538, 44, 3),
  circle("n4", "4", 271, 462, 44, 3), circle("n5", "5", 208, 456, 44, 3), circle("n6", "6", -12, 295, 44, 3),
  circle("start", "старт", 103, 735, 44, 2),
];

const DESK: Box[] = [
  { id: "rail", t: "навигация", x: 0, y: 0, w: 96, h: 800, s: 1 },
  ...[0, 1, 2, 3].map((i) => circle(`railItem${i}`, "", 24, 88 + i * 76, 48, i ? 2 : 3)),
  { id: "dAi", t: "плашка ИИ", x: 128, y: 20, w: 190, h: 26, r: 13, s: 2 },
  { id: "dLang", t: "UZ/RU", x: 1188, y: 20, w: 60, h: 26, r: 13, s: 2 },
  { id: "dGreet", t: "Привет + Bobr", x: 128, y: 62, w: 300, h: 40, r: 8, s: 3 },
  ...[0, 1, 2, 3].map((i) => circle(`dCat${i}`, ["Ustoz", "Bobr", "Мой путь", "Научи"][i], 128 + i * 112, 122, 80)),
  { id: "dHero", t: "урок + баннер: плотина", x: 128, y: 226, w: 464, h: 270, r: 40, s: 1 },
  { id: "dCard1", t: "чат с Ustoz + баннер", x: 128, y: 520, w: 464, h: 120, r: 30, s: 1 },
  { id: "dCard2", t: "болтать с Bobr + баннер", x: 128, y: 656, w: 464, h: 120, r: 30, s: 1 },
  { id: "dMap", t: "остров-махалля: дома и путь по уровням", x: 624, y: 62, w: 624, h: 714, r: 40, s: 1 },
  { id: "dStats", t: "тем у Bobr · шкала уровня", x: 652, y: 86, w: 568, h: 48, r: 24, s: 2 },
  { id: "dHouse", t: "мой дом", x: 820, y: 280, w: 220, h: 220, r: 18, s: 3 },
  ...[[700, 620], [860, 650], [1010, 580], [1100, 440], [960, 200], [700, 240]].map(([x, y], i) => circle(`dN${i + 1}`, String(i + 1), x, y, 52, 3)),
];

function Frame({ name, w, h, boxes }: { name: string; w: number; h: number; boxes: Box[] }) {
  return (
    <section data-frame={name} style={{ position: "relative", width: w, height: h, overflow: "hidden", flex: "none", background: "color-mix(in oklab, var(--color-dusk) 8%, var(--color-paper))" }}>
      {boxes.map((b) => (
        <div key={b.id} data-box={b.id} data-own={b.own ? "1" : undefined} style={{
          position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: b.r ?? 0,
          background: `color-mix(in oklab, var(--color-dusk) ${SHADE[b.s ?? 2]}%, var(--color-paper))`,
          display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
          fontSize: 11, lineHeight: 1.1, color: "var(--color-ink-muted)",
        }}>{b.t}</div>
      ))}
    </section>
  );
}

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 24 }}>
      <Frame name="home" w={390} h={844} boxes={HOME} />
      <Frame name="map" w={390} h={844} boxes={MAP} />
      <Frame name="desktop" w={1280} h={800} boxes={DESK} />
    </main>
  );
}
