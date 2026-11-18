// Ручная раскладка махалли: центр x и верх y блока «дом + табличка», в % от рамки карты.
// Два набора: узкий (телефон, рамка высокая) и широкий (≥ md). Улицы идут по диагоналям и по prereqs из графа.
export type Spot = readonly [x: number, y: number];

export const PHONE_ASPECT = "358 / 960";
export const WIDE_ASPECT = "672 / 620";
/** Ширина блока (кнопка + табличка) в % рамки; дом внутри — 26 % и 18 % рамки (87 % и 82 % блока). */
export const PHONE_W = 30;
export const WIDE_W = 22;
/** Куда садится конец улицы: центр стены дома, % рамки ниже верха блока. */
export const PHONE_ANCHOR_Y = 4.5;
export const WIDE_ANCHOR_Y = 7.8;

export const PHONE: Record<string, Spot> = {
  N1: [22, 0],
  N2: [50, 15.5],
  N3: [22, 31],
  N8: [78, 31],
  N4: [50, 46.5],
  N10: [16, 46.5],
  N6: [18, 62],
  N5: [50, 62],
  N7: [22, 77.5],
  N9: [80, 77.5],
};

export const WIDE: Record<string, Spot> = {
  N1: [11, 3],
  N2: [36, 9],
  N8: [61, 16],
  N6: [88, 4],
  N3: [14, 37],
  N4: [38, 43],
  N5: [63, 50],
  N9: [88, 52],
  N10: [14, 70],
  N7: [38, 72],
};
