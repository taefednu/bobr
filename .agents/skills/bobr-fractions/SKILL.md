---
name: bobr-fractions
description: Fraction handling in Bobr — fraction.js, string serialization, parseAnswer (ru/uz normalization, statuses ok/almost/misconception), generator, numberCheck, leakDetector with ru/uz word forms. Use when writing or changing anything in lib/fractions, answer checking, task generation, or code that compares, stores or displays a fraction.
---

# Дроби

Спека → «Детерминированные модули», «Граф тем». Ответ считает код — это пункт «не режем никогда».

## Хранение и сериализация

- Наружу (Convex, JSON, props, LLM) — только строка: `"3/10"`, смешанная `"1 1/2"`. Внутри — `new Fraction(s)`.
- `Fraction` хранит BigInt — Convex и `JSON.stringify` его не сериализуют. В документ кладём
  `f.toFraction()` (или `toFraction(true)` для смешанной), не объект.
- Никаких float: `0.1 + 0.2 !== 0.3`. Сравнение — `a.equals(b)`, `a.compare(b)`.
- Несократимость проверяй по **сырому** вводу (gcd числителя и знаменателя), а не после fraction.js —
  он сокращает сам, и «2/4» станет «1/2» до проверки.

## parseAnswer

Порядок: trim → NFKC → убрать zero-width → апострофы к одному виду → `½→1/2` → «0,5»→0.5 →
«1+1/2»→«1 1/2» → словесные «yarim / половина»→1/2 → деление на 0 → whitelist-regex → fraction.js.

| Статус | Когда |
|---|---|
| `ok` | равно ответу и несократимо (если просили сократить) |
| `almost` | равно ответу, но не сокращено |
| `misconception` | совпало с дистрактором (например M9: `1/2 + 1/3 → 2/5`) |
| иначе | неверно / не распознано |

## generator

Seeded PRNG (один сид → одна задача, для REPLAY и тестов). Знаменатели 2–12. Дистракторы различны и
≠ ответу. Три вида: картинка→число, текстовая, «найди пропущенное ?/6». MCQ — только в диагностике.

## numberCheck

Мультимножество чисел в тексте реплики = `numbersShown` задачи. worldRewrite пишет числа только
цифрами. Лишнее или пропавшее число → реплика отклонена.

## leakDetector

Ловит ответ в реплике в любой форме: эквиваленты `k·n/k·d` (k ≤ 10), десятичные, смешанные, словесные:

- ru: «две трети», «половина», «три пятых», «одна вторая»…
- uz: «uchdan ikki» (2/3: знаменатель первым, в исходном падеже на -dan), «yarim» (1/2), «chorak» (1/4),
  «beshdan uch»… Апострофы `ʻ ' ’` — нормализуй перед поиском.

## Тесты (vitest, `tests/`)

parser (+ апострофы, «yarim»), leak (uz-формы), copyCheck, сериализация, property-тест generator
(1000 сидов: дистракторы различны, ≠ ответу, знаменатели в 2–12). Тест на юникод — разными байтами
(скилл `prevent-vacuous-unicode-test`).
