// Ручная раскладка махалли: центр x и верх y блока «дом + табличка», в % от рамки карты.
// Два набора: узкий (телефон, рамка высокая) и широкий (≥ md). Улицы идут по диагоналям и по prereqs из графа.
export type Spot = readonly [x: number, y: number];

export const PHONE_ASPECT = "358 / 880";
export const WIDE_ASPECT = "672 / 620";
/** Ширина блока (кнопка + табличка) в % рамки; дом внутри — 87 % и 82 % блока. */
export const PHONE_W = 36;
export const WIDE_W = 22;
/** Куда садится конец улицы: центр стены дома, % рамки ниже верха блока. */
export const PHONE_ANCHOR_Y = 5.9;
export const WIDE_ANCHOR_Y = 7.8;
/** Пустой участок нарисован ниже в своей рамке, улица опускается к его пунктиру. */
export const PHONE_ANCHOR_EMPTY = 8.5;
export const WIDE_ANCHOR_EMPTY = 12.9;

export const PHONE: Record<string, Spot> = {
  N1: [24, 0],
  N2: [76, 4],
  N3: [24, 20],
  N8: [76, 24],
  N10: [24, 40],
  N4: [76, 44],
  N6: [24, 60],
  N5: [76, 62],
  N7: [24, 80],
  N9: [76, 80],
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
