---
name: task-measure-layout-matrix
description: "Verify Bobr layout fit, alignment and overflow with a headless DOM-measure matrix (viewports × UI states × uz/ru) instead of eyeballing screenshots. Use for 'doesn't fit', 'misaligned', 'unexpected scrollbar', one-screen lesson layouts."
allowed-tools:
  - Bash
  - Write
  - Read
---

# Матрица замеров вёрстки

Числа надёжнее снимка: `getBoundingClientRect` и `scrollHeight` по матрице вьюпортов и состояний, снимок —
только подтвердить.

## Шаги

1. Dev-сервер поднят: `curl -s -o /dev/null -w '%{http_code}' localhost:3000/route` → 200.
2. Быстрый проход — `npm run ui-check -- /route --viewports desktop,laptop,tablet,phone,phone-sm,phone-l --boxes '<селекторы>'`.
3. Нужны состояния (подсказка открыта/закрыта, CRISIS-оверлей, длинный uz-текст) — скрипт в scratchpad
   по образцу `scripts/ui-check.mjs` (импорт `playwright` из корня проекта: запускай `node` из корня):
   ```js
   const r = (el) => el.getBoundingClientRect();
   // innerHeight vs document.documentElement.scrollHeight → есть ли прокрутка на экране урока
   // дети блока: [...el.children].map(c => r(c).bottom) — дети вылезают за коробку, не двигая её
   ```
4. Критерий для экрана урока: задача, поле ответа и кнопка видны без прокрутки на 390×844 и 1280×800 в обоих языках.
5. Перед замером: `innerWidth === ширина вьюпорта && devicePixelRatio === 1`.

## Частые ошибки

- Мерить только коробку секции — дети вылезают, не двигая её.
- Один вьюпорт — баги видны на узком×низком (`phone-l` 844×390).
- Только ru — uz-строки длиннее и ломают кнопки.
