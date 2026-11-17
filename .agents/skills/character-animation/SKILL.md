---
name: character-animation
description: Acting rules for Bobr and Ustoz on screen — timing by "reads", anticipation, squash and stretch, overlapping action, avoiding twinning, emotion changes that never snap, strong key poses, common failures of generated character animation. Use when a character reacts, changes emotion, enters or leaves, or when a character moment feels mechanical or rushed.
---

# Актёрская игра персонажей

Источник — `ANIMATION_GUIDE.md` рядом (апстрим ClaudeAnimationBase, MIT, через videostudio). Он писался
для видео на p5.brush, поэтому из него у нас действуют только разделы:

| Раздел гайда | Строки | Для Bobr |
|---|---|---|
| 4. Timing: model the viewer | 49–61 | да: ребёнок видит реакцию один раз — время по «прочтениям» |
| 5. Alive | 63–69 | да, для персонажа; UI не «оживляем» (`bobr-design`) |
| Animation principles | 95–111 | да, целиком |
| Emotions (идея `emotions()`) | 355–378 | как устроить смену эмоции; функции из гайда не существуют у нас |
| Common failures | 423–442 | да, кроме пунктов про p5, кисть и «без текста» |
| 1–3, 6–7, Workflow, Engine, Clawd, Music | — | нет: это видео-движок. Clawd — персонаж Anthropic, его не рисуем |

Апстрим: github.com/JohnHeibel/ClaudeAnimationBase (MIT).

## Как это ложится на веб

- Персонаж — PNG-позы + framer-motion (скилл `bobr-mascot`), числа — `lib/motion.ts` (`IDLE`, `TRANSITIONS.pop`).
- **Прочтение ребёнка:** «Bobr понял» — антиципация 60–120 мс → реакция → пауза ≥ 400 мс перед следующим
  событием (текст реплики, кнопка). Реплика печатается после реакции, не одновременно.
- **Одно прочтение за раз:** персонаж реагирует, пока UI стоит. Кусок лепёшки двигается — персонаж смотрит
  на него, а не прыгает сам.
- **Смена эмоции не мгновенна:** прищур/сжатие перед сменой → подмена позы или глаз → реакция, размер
  которой зависит от эмоции (таблица в `bobr-animation`) → оседание с проскоком.
- **Без близнецов:** Bobr и Хумо не моргают и не покачиваются в такт; фазы idle разнесены.
- **Сильная поза:** каждая поза-PNG читается силуэтом. Если стоп-кадр непонятен, движение его не спасёт —
  нужна другая поза.

## Проверка

Снимок одного кадра не показывает движение. Для персонажа: `npm run ui-check -- <route>` для статики плюс
короткая запись (Playwright `recordVideo` или пошаговые кадры через `page.clock`) ключевой реакции; смотреть
по пунктам «Common failures».
