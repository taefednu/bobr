---
name: bobr-animation
description: Motion and character animation in Bobr — 2.5D/3D look (not Duolingo-flat), Bobr and Humo as PNG poses brought to life by framer-motion springs, idle life, emotion swaps, the 3D fraction pie, pose generation via Codex with a reference image. Use when building any animated component, mascot behaviour, pie/strip/number-line motion, or generating new character poses.
---

# Анимация Bobr

Сначала скилл `bobr-design` (старшинство и бан-лист). Числа — только из `lib/motion.ts` (`useMotion()`,
`TRANSITIONS`, `TARGETS`, `IDLE`, `EASE`). Новое число нужно — добавь туда с именем, не пиши литерал в
компоненте. Персонажи — `bobr-mascot` и `character-animation`; общая UI-анимация — `animate`,
`animate-react`, `emil-design-eng`, `animation-principles`.

## Два закона

1. **Персонаж всегда живой.** Bobr и Хумо дышат (`IDLE.floatPx`, период `IDLE.floatPeriodS`, sine),
   моргают каждые 2–4 с. Замер > 4 с без моргания читается как «завис».
2. **UI, текст и числа приземляются и стоят.** Проскок — только у физических вещей (персонаж, карточка,
   кусок лепёшки). Цифры, счётчики, текст — `TRANSITIONS.count` / `EASE.out`, без проскока: счётчик,
   проскочивший к 42, показал число, которого не было. Значение на лепёшке держится ≥ 0,5 с.

## Стиль: 2.5D/3D, не Duolingo

- Объём: мягкие тени, rim-light, один источник света на всю сцену (сверху-слева): верх светлый,
  левая грань средняя, правая тёмная. С v1 есть толстая ink-обводка и продавливаемые кнопки (`DESIGN.md` §4) — но плоская заливка и уступ цвета заливки остаются Duolingo, не мы.
- Без магазинов, монет, HP, конфетти-дождя. Награда — оживший дом и шкала уровня Bobr.
- Цвета кусков лепёшки — одинаковые L и C в OKLCH, разный H; градиенты `in oklch`.

## Персонаж из PNG-поз

- Поза — отдельный PNG с прозрачным фоном (6–10 поз хватит; «на всякий случай» не генерить).
  Другая рука = другая поза. Тело в PNG не двигается — движение даёт вся фигура: float, наклон ±6°,
  squash-stretch при приземлении, въезд/выезд.
- **Смена позы:** `scaleX → 0.04` за 130 мс → подменить PNG → `scaleX → 1` за 160 мс. Перед сменой —
  антиципация (лёгкое сжатие 60–120 мс).
- **Эмоция** (если глаза рисуются поверх PNG): старое выражение гаснет за 80 мс, новое выпрыгивает из
  `scale 0.4` за 220 мс (`TRANSITIONS.pop`). Моргание — `scaleY 0.08`, 70 мс туда-обратно.
- **Squash-stretch** (только персонаж): вершина прыжка `scaleY 1.2 / scaleX 0.85`, приземление
  `scaleY 0.8 / scaleX 1.15`, `scaleX·scaleY ≈ 1`. Прыжок ключами:
  `scaleY [1, .82, 1.16, 1, .78, 1]`, `scaleX` — обратные.
- Сила реакции по эмоции: neutral 0.3, happy 0.6, excited 1.0, surprised 1.3, idea 1.1, sad 0.3, sleepy 0.2.
- Актёрская игра: глаза ведут, тело следует, детали догоняют на 40–80 мс позже. «Быстрое действие —
  медленный смысл»: антиципация, потом пауза, чтобы реакция дошла. Сильная поза читается и стоп-кадром.
- Не зеркаль асимметричного персонажа (метка на ухе переедет на другую сторону).

## UI-движение

- Нажатие — кнопка уходит вниз на `TARGETS.pressDepthPx`, ink-уступ сжимается (`ledge = ledgePx − y`, одна MotionValue), `TRANSITIONS.press`; компонент `components/ui/press-button.tsx`. Верный ответ — «панч» (`TRANSITIONS.punch`, `TARGETS.punchScale`), только у физических вещей. Появление — из `TARGETS.appearFromScale`
  (0.9) + opacity, никогда из `scale(0)`. Выход ≈ 75 % входа, без пружины (`TRANSITIONS.exit`).
- Только `transform` и `opacity`. Hover — только под `HOVER_MEDIA`.
- Список: шаг 40–80 мс, общий въезд ≤ 600–800 мс, ввод не блокируется.
- Ожидание ответа LLM: анимация ожидания стартует < 150 мс, потом компонент, потом текст «печатной машинкой».
- Один «вау» на экран: оживший дом у родителя в момент, когда ребёнок научил Bobr.
- `prefers-reduced-motion`: `useMotion()` отдаёт мгновенные переходы — информация на месте, движения нет;
  idle персонажа тоже выключить. Флаг брать из `useMotion().reduced` / `useReducedMotionSafe()`, **не**
  `useReducedMotion` из framer: тот роняет гидрацию, если от флага зависит разметка (поймано ui-check).
- Анимация `transform` на элементе, который центрируется `translate(-50%)`, ломает центрирование —
  скилл `prevent-css-centering-animation`.

## Генерация поз

Позы и любые ассеты персонажей — скилл `bobr-mascot` (Codex по образцу, проверка альфа-канала, показ владельцу).

## Проверка

`npm run ui-check -- <route>` и `--reduced-motion`; живой пример всех пружин — `/dev/styleguide`.
