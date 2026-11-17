---
name: prevent-vacuous-unicode-test
description: "Prevention: тесты юникод-нормализации, где визуально-разные символы (curly ' U+2019 vs straight ' U+0027, латинская a vs кириллическая а) байт-идентичны на обеих сторонах assert — проверяют ничего. Apply when writing homoglyph/apostrophe/normalization tests or lexicons."
allowed-tools:
  - Bash
  - Grep
---

# Prevent: Vacuous Unicode Normalization Test

## Bug class
Тест нормализации/фолдинга сравнивает `_normalize("o'lmoqchiman") == _normalize("o'lmoqchiman")` — оба апострофа выглядят по-разному в комментарии («left U+2019, right U+0027»), но в БАЙТАХ оба `0x27` (straight). Тест пройдёт даже если фолд-таблица пустая → нулевое покрытие требования, ложная TDD-уверенность.

Хуже: вакуумный тест скрыл реальную дыру — `_APOSTROPHES` не содержал U+2019 (curly-апостроф автокорректа телефонов) → детекция self-harm UZ-фраз с curly-апострофом молча не работала.

Тот же класс: латинская `a` (U+0061) vs кириллическая `а` (U+0430) в гомоглиф-тестах; zero-width символы; en-dash U+2013 vs hyphen U+002D.

## Detection
```bash
# байт-проверка: реально ли отличаются символы в юникод-тесте
grep -c $'’' tests/test_*normali*.py tests/test_*guard*.py tests/test_*moderation*.py 2>/dev/null
# в тесте гомоглифов — присутствуют ли реальные кириллические байты
python3 -c "s=open('tests/test_moderation_core.py',encoding='utf-8').read(); print('U+2019 present:', '’' in s, '| U+0430 present:', 'а' in s)"
```
Проверить hex каждой стороны assert: `xxd`/`hex(ord(ch))` — если обе стороны `0x27`/`0x61`, тест вакуумный.

## Fix pattern
- Явные escape-и в литералах, чтобы байты не врали: `_normalize("o’lmoqchiman") == _normalize("o'lmoqchiman")`.
- End-to-end detect-тест: `filter.inspect("o’lmoqchiman").escalate is True` (терм в лексиконе со straight-апострофом).
- Фолд-таблица должна покрывать РЕАЛЬНЫЕ варианты автокорректа: U+2019 (’), U+02BB (ʻ), U+02BC (ʼ), backtick → U+0027.
- Regression-проба: тест должен ПАДАТЬ на коде без фолда (мысленно или временным откатом таблицы).

## Trigger
Apply when: пишешь тесты нормализации/casefold/гомоглифов/апострофов/zero-width; строишь лексикон терминов, нормализуемых при инициализации.
