---
name: bobr-mascot
description: Bobr the beaver and Ustoz the Humo bird as characters — PNG pose library, generating new poses with Codex from a reference, transparent-background check, eyes/emotions in code, idle float and blink, pose swap, recognisability invariants. Use when adding or animating a character pose, emotion, or reaction, or generating any character asset.
---

# Персонажи: Bobr и Ustoz

Схема перенесена из маскота видеостудии (позы-PNG + игра кодом) и переложена на веб: framer-motion
вместо GSAP, `public/bobr/` (кикофф) вместо ассетов студии. Числа движения — `lib/motion.ts`.

## Кто они (спека)

- **Bobr** — бобр-подросток. Спека: «тупой как пробка, но милый»; владелец 18.11 (DESIGN v1): **дерзкий и смешной, а не милый** — самоуверенный, хвастается, ошибается с полной уверенностью, гордится каждой мелочью, учится у ребёнка. Дерзит себе, задаче и миру, **никогда ребёнку и его ошибке** (`PRODUCT.md`). Позы — с характером: ухмылка, бровь вверх, «я гений», комичный провал; не умильные глазки.
- **Ustoz** — птица Хумо. Спокойная, немного ироничная, ведёт вопросами, ответ не выдаёт.
- Оба — ИИ и никогда не говорят, что живые. В облике нет ничего, что делает их «человеком» (телефон, имя в паспорте…).

Инварианты узнаваемости (записать сюда, когда владелец утвердит первую позу): цвет меха/перьев, форма
зубов, хвост, метка, пропорции головы. Костюм дополняет, но не закрывает инварианты. Не зеркалить
асимметричного персонажа.

## Устройство

| Что | Где |
|---|---|
| Позы (прозрачный PNG, ≤ 600 px по большей стороне, webp рядом) | `public/bobr/<pose>.png` (позы кикоффа: idle, think, confused, happy, aha, proud, sad, wave), `public/ustoz/<pose>.png` |
| Реестр поз | `lib/characters/poses.ts`: `{ id, file, w, h, eyes?: [x, y, rx, ry][] }` |
| Компонент | `components/characters/Character.tsx` (поза + idle + реакция) |
| Образец стиля для новых поз | первая утверждённая поза каждого персонажа |

(Файлов пока нет — заведи по этой схеме при первой позе.)

- Тело в PNG неподвижно. Движение даёт вся фигура: float (`IDLE.floatPx`, `IDLE.floatPeriodS`),
  наклон ±6°, squash-stretch при приземлении, въезд/выезд. Другая рука — другая поза.
- **Смена позы («кувырок»):** `scaleX → 0.04` за 130 мс → подмена `src` → `scaleX → 1` за 160 мс.
- **Эмоции.** Вариант A (по умолчанию): эмоция — отдельная поза-PNG, смена через кувырок. Вариант B:
  глаза рисуются SVG поверх PNG по координатам `eyes` из реестра — тогда эмоции (normal, happy, sad,
  surprised, thinking, proud, confused) меняются без новой позы: старое выражение гаснет за 80 мс, новое
  выпрыгивает из `scale 0.4` за 220 мс (`TRANSITIONS.pop`); моргание — `scaleY 0.08`, 70 мс туда-обратно,
  каждые `IDLE.blinkEveryS` (2–4 с, случайно). B требует поз без нарисованных глаз.
- **Замер > 4 с без моргания** читается как «завис».
- `prefers-reduced-motion`: позы меняются мгновенно, idle и моргание выключены (`useMotion().reduced`).
- Предзагрузка: все позы экрана — `<link rel="preload">` или `new Image()` заранее, иначе кувырок мигает пустотой.

## Новая поза (Codex)

Из папки персонажа, промпт **до** `-i` (флаг жадный):

```bash
codex exec --skip-git-repo-check --sandbox workspace-write "Generate an image: the beaver mascot Bobr from the reference image, in EXACTLY the same style: soft 3D clay render, warm key light from the top left, same proportions, colours, teeth and tail. Pose: <what he does, what is in his paws, lean>. Full body, centered, nothing cropped. No extra limbs, no text. Fully transparent background (PNG with alpha channel, no backdrop, no shadow plate). Save it as <pose>.png in the current directory." -i <reference>.png
```

- Без референса выйдет другой персонаж. Поза — по-английски, конкретно: предмет, что делает лапа, наклон.
  Эмоцию в позу закладывай только в варианте A.
- Нужно 6–10 поз на персонажа; «про запас» не генерить. Одна картинка ≈ 1 % пятичасового лимита Codex.
- Проверка после генерации:
  ```bash
  python3 -c "from PIL import Image; im=Image.open('<pose>.png'); print(im.mode, im.size, [im.getpixel(p)[3] for p in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]])"
  ```
  → `RGBA` и четыре нуля. Не прозрачно — скилл `task-local-bg-removal`.
- Глазами: стиль как у образца, фигура целиком, анатомия не уехала (лишние лапы, другой хвост), нет текста.
  Не совпало — ещё одна попытка с уточнением, максимум 2, затем показать владельцу.
- Удали пустые `.git .codex .agents`, которые codex оставляет в папке.
- Готовую позу — владельцу (SendUserFile) до того, как она попадёт в продукт.
