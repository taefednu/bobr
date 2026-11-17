---
name: bobr-design
description: Entry point for ANY visual or motion work in Bobr — which design/animation skill to load for the situation, the Bobr art direction that overrides every generic skill, the ban list, and how to prove a UI change with screenshots. Load this first before building or changing a screen, component, character animation, palette, typography, or asset; then load the skill it routes you to.
---

# Дизайн и анимация Bobr: с чего начинать

## Порядок старшинства

Конфликт решается сверху вниз:

1. `docs/BOBR_SPEC.md` — продукт.
2. `PRODUCT.md` — для кого и какой характер (impeccable и прочие читают его сами).
3. `DESIGN.md` — токены и правила вида (v0, ждёт владельца). Рантайм-токены — `app/globals.css`.
4. `lib/motion.ts` — все длительности, кривые, пружины.
5. Любой скилл ниже — **только приёмы**. Его палитры, шрифты, «baseline»-значения, рекомендации
   библиотек и структуры лендинга не действуют: у нас свои.

Скиллы с такими же именами, как в `~/.claude/skills`, у Claude Code грузятся из глобальной копии —
поэтому все поправки под Bobr живут здесь, а не в теле скилла.

## Известные конфликты скиллов с Bobr (найдены пробным прогоном)

| Скилл говорит | У Bobr действует |
|---|---|
| `impeccable` craft: ждать одобрения shape-брифа пользователем | бриф = задача + спека + `DESIGN.md`. Для экрана из спеки одобрение не ждём; показываем владельцу снимки результата. Новый экран вне спеки — сначала `shape` и вопрос владельцу |
| `impeccable`: «no bounce, no elastic» | проскок разрешён ровно там, где он есть в `lib/motion.ts`: нажатие, персонаж, кусок лепёшки. UI, текст и числа — без проскока |
| `frontend-design`: тёплый кремовый фон и терракота — признак ИИ-шаблона | палитра Bobr выведена из мира спеки (махалля, глина, лепёшка), это выбор, а не шаблон. Не «исправлять» |
| `frontend-design`: «make opinionated choices about palette, typography» | выбор уже сделан в `DESIGN.md`; новое — только как вопрос владельцу |
| `isometric-animation`: GSAP-таймлайн, Three.js, `scripts/seek-shot.sh` | приём изометрии — CSS 3D / инлайн-SVG + framer-motion. Скрипта `seek-shot.sh` в скилле нет (видео-проверка) — проверяем `npm run ui-check` |
| `animate-react`: `npm install react-use-measure usehooks-ts` | без новых зависимостей; измерение — `ResizeObserver` в своём хуке |
| `design-taste-frontend`: «perpetual micro-interactions», Phosphor-иконки, Geist/Satoshi | вечное движение — только у персонажа; иконки — инлайн-SVG; шрифты — Unbounded + Onest |
| `ui-ux-pro-max`: лендинговый паттерн (Hero → Features → CTA), его палитра | стиль «claymorphism для детского образования» совпадает с нашим; паттерн и цвета — нет |

Дома на карте — инлайн-SVG/CSS 2.5D (пробный прогон показал, что это выглядит хорошо и токенизируется).
PNG через Codex — для персонажей и, по просьбе владельца, для героических иллюстраций.
Не хватает токена или пружины — добавь в `app/globals.css` / `lib/motion.ts` с именем, не литерал в компоненте.

## OpenUI (Thesys) — только болталка

Скилл `openui` (генеративный UI: модель пишет OpenUI Lang, рендерер рисует компоненты).

- **Где можно:** только болталка с Bobr (CHAT) — карточки, опросы, мини-реакции. Там реплика свободная,
  и модель может выбрать вид ответа.
- **Где нельзя никогда:** урок, диагностика, «Научи Bobr», махалля, `/parent`. В уроке компонент
  (Лепёшка / Полоска / Прямая) и его числа выбирает код из `{reply, component:{type, params}}`;
  генеративный UI там ломает «код решает, LLM говорит».
- **Интеграцию в продукт не делать до чекпоинта** 18.11 15:00 и без ок владельца: болталка в порядке резки
  спеки, а пакеты `@openuidev/*` — новая зависимость.
- Правила скилла, которые у Bobr не действуют: OpenUI Gateway, `THESYS_API_KEY`, «сотни моделей», BYOK —
  у нас только `claude-haiku-5-5` / `claude-sonnet-5-5` через `lib/llm` (скилл `bobr-llm-call`); вывод
  болталки идёт через тот же outputCheck и плашку ИИ. `npx @openuidev/cli feedback` не запускать.

## Какой скилл когда

| Ситуация | Скилл | Заметка для Bobr |
|---|---|---|
| Новый экран или компонент с нуля | `frontend-design` → `impeccable` (craft) | направление уже задано `DESIGN.md`; не выбирай новое |
| Спланировать UX фичи до кода | `shape` | интервью — по спеке, не владельцу; вопросы владельцу только о продукте |
| Экран выглядит «как ИИ» / шаблонно | `unslop` | направление брать из `PRODUCT.md`, не изобретать |
| Финальная полировка перед показом | `polish`, `emil-design-eng` | |
| Разбор качества, оценка | `critique`, `audit` | `audit` — a11y и производительность |
| Скучно / слишком громко | `bolder` / `quieter` | `bolder` не даёт права на неон и градиентный текст |
| Убрать лишнее | `distill` | один экран — одно действие |
| Сетка, отступы, ритм | `layout` | |
| Шрифты, иерархия | `typeset` | только Unbounded + Onest из `DESIGN.md` |
| Цвет | `colorize`, `color-motion` | только токены `DESIGN.md`; новые — OKLCH, в `globals.css` |
| Телефон / планшет | `adapt` | 390 px — основной детский экран |
| Тексты интерфейса, ошибки | `clarify` + `bobr-i18n` | uz и ru сразу |
| Тормозит анимация, бандл | `optimize` | |
| «Вау»-момент (дом оживает у родителя) | `overdrive`, `delight` | один на экран; без новых зависимостей |
| Идеи стилей, UX-правила, чек-листы | `ui-ux-pro-max`, `design`, `design-taste-frontend`, `high-end-visual-design`, `redesign-existing-projects`, `gpt-taste`, `stitch-design-taste` | брать правило, не палитру и не шрифт |
| Обновить `DESIGN.md` из кода | `design-md`, `impeccable` (document) | |
| Сгенерировать реф экрана картинкой | `imagegen-frontend-web`, `imagegen-frontend-mobile`, `image-to-code` | только по просьбе владельца; ≤ 3 картинки за задачу |
| Бренд-борд, логотип | `brandkit`, `logo-animation` | |
| Анимация: с нуля | `animate` → `animate-react` | значения — из `lib/motion.ts` |
| Анимация: «как называется эффект» | `animation-vocabulary` | |
| Анимация: где добавить / что починить | `find-animation-opportunities`, `improve-animations` | |
| Тайминг, пружины, «деревянное» движение | `animation-principles`, `motion-art-direction` | персонаж живой, UI стоит |
| Персонаж: позы, эмоции, моргание, игра | `bobr-mascot`, `character-animation`, `bobr-animation` | |
| 2.5D-махалля, дома, глубина | `isometric-animation` | CSS 3D / SVG, **без Three.js** |
| Фон-атмосфера | `motion-background` | CSS-градиенты, без шейдеров по умолчанию |
| Заголовок / число с анимацией | `kinetic-typography` | framer-motion, не GSAP; числа без проскока |
| Сделать как на картинке-макете | `task-design-ref-match` | обязательный порядок — в скилле |
| Снимок экрана, замер геометрии | `task-design-screenshot`, `task-measure-layout-matrix` | `npm run ui-check` |
| Показать систему владельцу | `task-design-system-sheet` | живой лист `/dev/styleguide` |
| Цвет зашит в компонент | `task-color-sweep` | |
| Мелкие ловушки | `prevent-css-centering-animation`, `prevent-keyless-list-child-state`, `prevent-invented-fallback-data`, `prevent-unknown-rendered-as-zero` | |

## Запрещено (что модели выбирают по умолчанию)

Причина у всех одна: спека и `PRODUCT.md` уже выбрали другое, а эти приёмы делают из Bobr чужой продукт.

- **Зависимости:** GSAP, Three.js / react-three-fiber, Lottie, react-spring, shadcn/ui, иконпаки
  (Phosphor, Lucide, Radix icons). Хватает framer-motion, CSS и инлайн-SVG. Новая зависимость — вопрос владельцу.
- **Геймификация:** монеты, кристаллы, сердечки, HP, огонь серии, магазин, рейтинги, конфетти-дождь,
  «вернись», уведомления-давилки. У нас есть только число тем у Bobr и шкала его уровня.
- **Duolingo:** плоский вектор, толстые обводки, кнопки с нижним «уступом», совиный зелёный.
- **Шаблон ИИ:** фиолет и неон, градиентный текст, glassmorphism, bento-сетка, центрированный hero,
  «3 карточки в ряд», лендинговая структура AIDA. Это продукт, не лендинг.
- **Ошибка ребёнка:** красный цвет, тряска поля, таймер. Реагирует Bobr, интерфейс остаётся спокойным.
- **Вечное движение UI:** пульсации, мерцания, шиммер на всём подряд. Живой только персонаж.
- **Эмодзи** в UI и текст внутри картинок (два языка).
- `#000`, чисто белый фон, серые тени.
- Плашка ИИ: прятать, анимировать, делать мельче label.

## Как доказать UI-правку

```bash
npm run dev                                   # в отдельном терминале
npm run ui-check -- /route                    # desktop 1280 + phone 390, язык uz
npm run ui-check -- /route --lang ru --full   # второй язык, вся страница
npm run ui-check -- /route --reduced-motion   # без движения: всё на месте?
```

`--lang` ставит локаль браузера и `localStorage["bobr:lang"]`; пока в продукте нет переключателя языка,
оба языка на dev-страницах выводи рядом.

Код 0 — нет горизонтального переполнения, обрезанных кнопок и ошибок консоли/гидрации. Затем открой
PNG из `.ui-check/` и смотри вопросом «что здесь сломано»: выравнивание, пустые полосы, наложения,
текст uz длиннее ru. Отдельный взгляд — агент `ui-verifier`; оценка дизайна — агент `design-critic`.

По картинке-макету — только через `task-design-ref-match`: дизайн-система до кода, замер, реализация,
наложение и таблица «макет / страница / Δ %», расхождение > 5 % — не готово.

## Ассеты

Позы Bobr и Хумо, иллюстрации домов — PNG через Codex по образцу (скилл `bobr-mascot`), прозрачный
фон проверяется кодом. Иконки и простые формы — инлайн-SVG руками. Готовый ассет показывается
владельцу до того, как попадёт в продукт.
