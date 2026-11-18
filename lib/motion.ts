/**
 * Набор движения Bobr — единственный источник длительностей, кривых и пружин.
 * Компоненты берут переходы отсюда (`useMotion().transitions`), а не пишут числа сами:
 * так весь продукт двигается одним характером. Правила — скилл `bobr-animation`.
 *
 * Два закона:
 * - Персонаж (Bobr, Хумо) всегда живой: дыхание, моргание, idle — `IDLE`.
 * - UI, текст и числа приземляются и стоят. Проскок — только у физических вещей
 *   (карточка, персонаж, кусок лепёшки), никогда у цифр: счётчик, проскочивший
 *   к 42, показал число, которого не было.
 */
import { useMemo, useSyncExternalStore } from "react";

export type MotionName = "press" | "appear" | "exit" | "panel" | "move" | "count" | "pop" | "punch" | "pageIn";

export type Bezier = readonly [number, number, number, number];

export type FramerTransition =
  | { type: "spring"; stiffness: number; damping: number; mass: number }
  | { type: "tween"; duration: number; ease: Bezier };

/** Кривые. `out` — вход UI; `inOut` — перемещение по экрану; `back` — игривый проскок (только физическое). */
export const EASE = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  back: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, Bezier>;

const spring = (stiffness: number, damping: number, mass = 1): FramerTransition => ({
  type: "spring",
  stiffness,
  damping,
  mass,
});
const tween = (ms: number, ease: Bezier): FramerTransition => ({ type: "tween", duration: ms / 1000, ease });

/** Именованные движения. press — проседает почти мгновенно (< 80 мс) и чуть подпрыгивает при отпускании,
 *  punch — быстрый удар масштаба, оседает за ~250 мс (только физическое), appear — ~6 %, panel — без раскачки. */
export const TRANSITIONS: Record<MotionName, FramerTransition> = {
  press: spring(1400, 26, 0.6),
  appear: spring(380, 26),
  exit: tween(160, EASE.out),
  panel: spring(320, 34),
  move: spring(300, 28),
  count: tween(700, EASE.out), // числа: без проскока
  pop: spring(400, 17), // персонаж, награда, кусок лепёшки
  punch: spring(700, 18, 0.6), // поле ответа, физический предмет; не цифры
  pageIn: tween(180, EASE.out), // вход экрана: только opacity (transform на предке сломает fixed)
};

/** Цели: выступ кнопки в покое и насколько она проседает при нажатии (выступ = ledgePx − y, DESIGN.md §4),
 *  подъём при наведении, масштаб удара, масштаб появления окна (не из 0). */
export const TARGETS = {
  ledgePx: 5,
  pressDepthPx: 4,
  hover: { lift: -1 },
  punchScale: 1.08,
  appearFromScale: 0.9,
} as const;

/** Idle персонажа: дыхание и моргание. Замер дольше 4 с без моргания читается как «завис». */
export const IDLE = {
  floatPx: 6,
  floatPeriodS: 2.4,
  blinkMs: 120,
  blinkEveryS: [2, 4] as const,
} as const;

/** Жизнь в покое (E6). `IDLE` не трогаем: им пользуются старые места. Фигура стоит на земле: подъём 2 px,
 *  дыхание сжимает/растягивает от низа, лапы не отрываются; под ней пятно. Разные ритмы: Bobr тяжёлый и
 *  неторопливый, Ustoz лёгкий и быстрый, поэтому не идут в такт. Фаза случайная на каждый экземпляр. */
export const IDLE_LIFE = {
  bobr: { liftPx: 2, breatheY: 1.025, breatheX: 0.985, swayDeg: 1.2, periodS: IDLE.floatPeriodS, swayPeriodS: 3.7 },
  ustoz: { liftPx: 3, breatheY: 1.015, breatheX: 0.992, swayDeg: 2.4, periodS: 1.7, swayPeriodS: 2.6 },
  /** Раз в столько секунд (случайно) живой персонаж сам играет POSE_ACT.think.act. */
  gestureEveryS: [7, 12] as const,
} as const;

/** Реплика «печатается» по словам (E4): слово целиком, дробь «1/2» не появится наполовину.
 *  Шаг между словами сжимается так, чтобы вся реплика уложилась в `maxS`. */
export const TYPING = { wordMs: 70, maxS: 1.6, wordFadeS: 0.12 } as const;

/** Сколько секунд печатается реплика (с задержкой облачка): по ней персонаж «говорит». */
export function typingSeconds(text: string): number {
  const n = text.split(/\s+/).filter(Boolean).length;
  if (n === 0) return 0;
  return BUBBLE_DELAY_S + (n - 1) * (Math.min(TYPING.wordMs, (TYPING.maxS * 1000) / n) / 1000) + TYPING.wordFadeS;
}

/** Пока печатается реплика, тело персонажа «говорит»: лёгкий пульс от пола. */
export const TALK = { scaleY: [1, 1.03, 1], scaleX: [1, 0.985, 1], periodS: 0.32 } as const;

/** Облачко реплики появляется после персонажа; точки ожидания не мигают на быстрой мутации. */
export const BUBBLE_DELAY_S = 0.08;
export const THINKING_DOTS_DELAY_S = 0.12;

/** Поза Bobr на одном PNG: наклон-стойка (`rest`) и разовое действие при смене реплики (`act`, ключи).
 *  Только персонаж: сжатие и подскок. Пока нет PNG под каждую позу, поза читается движением. */
export const POSE_ACT: Record<string, { rest: { rotate: number; scale: number }; act: { y?: number[]; rotate?: number[]; scale?: number[] }; durationS: number }> = {
  idle: { rest: { rotate: 0, scale: 1 }, act: {}, durationS: 0.4 },
  wave: { rest: { rotate: 0, scale: 1 }, act: { rotate: [0, -9, 9, -9, 9, 0] }, durationS: 0.9 },
  happy: { rest: { rotate: 0, scale: 1 }, act: { y: [0, -16, 0, -6, 0] }, durationS: 0.6 },
  aha: { rest: { rotate: 0, scale: 1.04 }, act: { y: [0, -34, 0, -14, 0], scale: [1, 1.1, 0.96, 1.03, 1.04] }, durationS: 0.8 },
  proud: { rest: { rotate: 0, scale: 1.06 }, act: { scale: [1, 1.12, 1.06] }, durationS: 0.5 },
  think: { rest: { rotate: 6, scale: 1 }, act: { rotate: [0, 10, 6] }, durationS: 0.5 },
  confused: { rest: { rotate: -6, scale: 1 }, act: { rotate: [0, -11, -6], y: [0, -4, 0] }, durationS: 0.5 },
  sad: { rest: { rotate: 0, scale: 0.95 }, act: { y: [0, 6, 4] }, durationS: 0.5 },
};

/** Ожидание ответа: Bobr качает головой, три точки в облачке зажигаются по очереди. Крутится, пока ждём. */
export const THINKING = { rotate: [-4, 6, -4], periodS: 1.6, dotStepS: 0.25, dotPeriodS: 1.1 } as const;

/** Каскад блоков при входе на экран: один раз, только opacity и сдвиг; весь каскад не длиннее `maxS`, ввод не ждёт. */
export const REVEAL = { stepS: 0.06, y: 10, maxS: 0.42 } as const;

/** Визуализации дробей (лепёшка, полоска, прямая, кольцо): появляются по очереди один раз при показе, закрашенные
 *  «наливаются», проценты считаются без проскока. Мс отдаются в CSS-анимации (`.v3-viz-*`, globals.css) инлайном.
 *  Вся очередь долей укладывается в `queueMaxMs`, чтобы лепёшка на 12 долей не тянулась. */
export const VIZ = { inMs: 240, sliceStepMs: 55, queueMaxMs: 500, fillMs: 380, fillAfterMs: 120, ringMs: 900, countMs: 900, startMs: 80 } as const;

/** Задержка i-го элемента из n в очереди визуализации (мс): шаг сжимается, если очередь длиннее `queueMaxMs`. */
export function vizDelayMs(i: number, n: number): number {
  return VIZ.startMs + i * Math.min(VIZ.sliceStepMs, VIZ.queueMaxMs / Math.max(1, n));
}

/** Нажатие карточки или камня на тач-экране: чуть глубже кнопки, без проскока по масштабу. */
export const PRESS = { scale: 0.97, stone: 0.86 } as const;

/** Наведение только на устройствах с мышью: на касании ложный hover поднимает кнопки. */
export const HOVER_MEDIA = "(hover: hover) and (pointer: fine)";

/** «Уменьшить движение»: информация на месте, движения нет. */
export const STILL: FramerTransition = { type: "tween", duration: 0, ease: [0, 0, 1, 1] };

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const q = window.matchMedia(REDUCED_QUERY);
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
}

/** «Уменьшить движение». Не `useReducedMotion` из framer: тот на клиенте с первого рендера отдаёт
 *  true, сервер — false, и разметка, зависящая от флага, роняет гидрацию. Здесь гидрация идёт со
 *  значением сервера (false), реальное приходит следующим рендером. */
export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

export function useMotion() {
  const reduced = useReducedMotionSafe();
  return useMemo(() => {
    const transitions = reduced
      ? (Object.fromEntries(Object.keys(TRANSITIONS).map((k) => [k, STILL])) as Record<MotionName, FramerTransition>)
      : TRANSITIONS;
    return { reduced, transitions, targets: TARGETS };
  }, [reduced]);
}
