# Демо без интернета: локальный Convex

Бэкенд Convex крутится на ноуте как бинарник `convex-local-backend`. Аккаунт Convex не нужен.

## Что проверено (18.11.2026, WSL2, Node 22.23.3)

| Проверка | Результат |
|---|---|
| `convex dev --once` в сетевом namespace без сети (`unshare -rn`) с флагом версии | функции задеплоены, exit 0 |
| То же без `--local-backend-version` | падает: `Failed to fetch latest backend version` |
| Адрес, который слушает бэкенд | `0.0.0.0:3210` (API) и `0.0.0.0:3211` (HTTP actions) внутри WSL |
| `npx convex env set DEMO_MODE replay` на анонимном локальном бэкенде | записалось, `env list` показывает |
| `npm run dev` → `/`, `/lesson`, `/parent` | 200 (с сетью) |

Что не проверено: доступ со второго ноута по Wi‑Fi и запуск Next без сети.

## Подготовка (один раз, пока есть интернет)

```bash
nvm use            # Node 22 из .nvmrc, на Node 20 Convex не запускается
npm install
CONVEX_AGENT_MODE=anonymous npx convex dev --once
```

Последняя команда скачивает бинарник в `~/.cache/convex/binaries/<версия>/`, создаёт `.convex/local/`
и пишет `CONVEX_DEPLOYMENT` и `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210` в `.env.local`.
Скачанная версия видна так:

```bash
ls ~/.cache/convex/binaries
```

Сейчас это `precompiled-2026-11-16-80befbc`.

## Запуск на демо

Два терминала:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev --local-backend-version precompiled-2026-11-16-80befbc
```

```bash
npm run dev
```

Флаг `--local-backend-version` обязателен. Без него CLI при каждом старте идёт в сеть за номером
последней версии и без интернета падает. Обновится бинарник — подставь новое имя из `ls` выше.

## Ключ Claude

Actions читают переменные из окружения Convex, а не из `.env.local`:

```bash
npx convex env set ANTHROPIC_API_KEY <ключ>
npx convex env set DEMO_MODE replay
```

Без интернета работает только `DEMO_MODE=replay`: ответы берутся из таблицы `llmCache`. Перед
демо прогони весь сценарий в `live` с сетью, чтобы кэш заполнился. Локальный бэкенд держит данные в `.convex/local/`; папка в `.gitignore`.

## Два ноута (родитель видит дом в ту же секунду)

Бэкенд слушает все интерфейсы, но внутри WSL2. В NAT-режиме WSL другой ноут на него не попадёт.
Варианты, оба не проверены:

- в `%UserProfile%\.wslconfig` поставить `networkingMode=mirrored` и перезапустить WSL;
- или пробросить порты в PowerShell от администратора:
  `netsh interface portproxy add v4tov4 listenport=3210 connectport=3210 connectaddress=<IP WSL>`
  (и то же для 3211 и 3000), плюс правило в брандмауэре.

На втором ноуте открыть `http://<IP первого ноута>:3000/parent`. Для этого Next собирать с
`NEXT_PUBLIC_CONVEX_URL=http://<IP первого ноута>:3210`: с адресом `127.0.0.1` браузер второго ноута
пойдёт к самому себе. Роутер на демо — свой, без интернета, лишь бы оба ноута были в одной сети.

## Запасной путь

Если локальный бэкенд не поднялся, показываем запасное видео (спека, «Сбои и демо»).
