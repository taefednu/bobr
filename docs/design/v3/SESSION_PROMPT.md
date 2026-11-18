# Промпт новой сессии

Модель сессии: Opus 5.5, советник: `/advisor fable`. Вставить целиком:

```text
Bobr, трек A, сессия core: /home/taef/projects/bobr, ветка main. Ты Opus-оркестратор, советник Fable (инструмент advisor: до выбора подхода и перед «готово»).

Цель: собрать 4 мобильных экрана по эталонам 1 к 1: главный, «Мой дом», чат с Ustoz, профиль. Кадр 390×845, десктоп не делаем.

Прочитай: CLAUDE.md, docs/design/v3/README.md (спека и токены), docs/design/v3/PIXEL_QA.md (формат сверки), docs/design/v3/ASSETS.md (арт), раздел «Сейчас» в knowledge/sprint.md. Посмотри 1-home.png, 2-house.png, 3-chat.png, 4-profile.png в docs/design/v3 и refs/owner-home.png, refs/owner-map.png.

Подготовка:
- git status, затем `git pull --rebase` и `git push`: в main могли остаться незапушенные коммиты прошлой сессии.
- Convex без сети: `CONVEX_AGENT_MODE=anonymous npx convex dev --local-backend-version precompiled-2026-11-16-80befbc` (через `. scripts/node22.sh`), Next: `npm run dev -- -p 3000`. Запускай через setsid nohup, чтобы они пережили перезапуск приложения. Проверь `DEMO_ALLOW_ANON=1`.

Порядок:
1. Основа, один агент implementer + ты сам для схемы: токены --v3-* , фон экрана, общие компоненты в components/v3 (экран, таб-бар, карточка, круглая кнопка, шторка), v3-маршруты без старой шапки, routeForState(HOME) → /home, скелет app/dev/v3/<экран> с notFound в production, запросы home:view, house:view, profile:view, profile:setLang, visual в chat:view. Контракт из README. schema/types/config правишь только ты. Проверка: npm run verify, демо-путь, scripts/turn-smoke.sh, затем коммит и пуш.
2. Сразу с шага 1 в фоне отдельный агент ассетов по ASSETS.md: каждый объект с эталона отдельным файлом с прозрачным фоном в public/v3, лист для показа владельцу.
3. После основы 4 агента implementer параллельно, один экран на агента. Зона каждого: components/v3/<экран>/**, app/(child)/<экран>/**, app/dev/v3/<экран>/**, свои ключи i18n, docs/design/v3/measure/<экран>.json только с причиной. Общие компоненты меняет только оркестратор. Пока арта нет, агент берёт docs/design/v3/crops. Каждому в бриф: скиллы bobr-design, impeccable, frontend-design, layout, typeset, bobr-mascot, bobr-animation, emil-design-eng, bobr-i18n через Skill; цикл из PIXEL_QA.md; не коммитить.
4. Приёмка экрана: сам открой .ref-check/<экран>/compare.png и report.md, код выхода node scripts/ref-check.mjs <экран> должен быть 0, затем боевой маршрут ru и uz. Быстрое ревью агентом reviewer по диффу экрана, чини находки, npm run verify, коммит, пуш.
5. В конце подключи финальные ассеты, повтори ref-check на всех экранах, пройди весь демо-путь в браузере на 390 px, покажи владельцу снимки эталон / экран.

Параллельно экранам: docs/design/v3/BACKEND_TASKS.md, субагентами по строкам таблицы, соблюдая колонку «Когда». Экраны важнее: при нехватке времени режь с конца таблицы.

Не трогать без отдельной задачи (исключения названы в BACKEND_TASKS.md): preGuard, guard, outputCheck, CRISIS, маску ПДн. Детали безопасности чата не упрощать. Отчитывайся коротко: таблица экранов, ref-check, снимки.
```
