---
name: task-design-screenshot
description: "Take reliable screenshots of Bobr pages (desktop 1280 / phone 390, uz/ru, reduced motion, full page, block geometry) with the project's headless ui-check script. Trigger: you need a screenshot of a page or block to verify a UI change or compare with a ref."
allowed-tools:
  - Bash
  - Read
---

# Снимок страницы Bobr

```bash
npm run dev                                                    # отдельный терминал / run_in_background
npm run ui-check -- /route                                     # desktop 1280×800 + phone 390×844, uz
npm run ui-check -- /route --lang ru --full                    # ru, вся страница
npm run ui-check -- /route --viewports laptop,tablet,phone-sm  # другие размеры (список — в скрипте)
npm run ui-check -- /route --reduced-motion                    # без движения
npm run ui-check -- /route --boxes 'main,[data-testid=pie]'    # геометрия блоков в % ширины
```

PNG — в `.ui-check/<route>-<lang>/<viewport>.png` (в `.gitignore`). Открой через Read и смотри.

## Почему не MCP-playwright

В WSLg браузер MCP рисуется в окне фиксированного размера: `browser_resize` и `setViewportSize`
игнорируются. Headless-скрипт задаёт вьюпорт честно. Скрипт ждёт `document.fonts.ready` и 900 мс, чтобы
пружины встали.

## Код выхода

1 — горизонтальное переполнение, кнопка за краем (CLIPPED), ошибка консоли/страницы/HTTP ≥ 400, редирект
или ошибка гидрации. TRUNC — предупреждение об обрезанном тексте, разобрать каждое.

## Частые ошибки

- Dev-сервер со старым кодом (скилл `prevent-stale-dev-server-serves-old-code`) — перезапусти.
- Блок ниже фолда — `--full`.
- Снимок посреди анимации — для ключевой реакции персонажа нужна запись или кадры, не один PNG.
- Playwright закреплён на 1.64.0 под уже скачанный браузер (`~/.cache/ms-playwright/chromium_headless_shell-1248`);
  обновишь пакет — `npx playwright install chromium`.
