# Ассеты экранов v3

Владелец: **каждое изображение с эталона вытащить отдельным объектом.** Птица из круга, бобр, указатель, книга, бобр с лепёшкой
и так далее. Тот же рисунок, тот же ракурс, чистый прозрачный фон. Новых персонажей и новых сцен не придумывать.

Папка результата: `public/v3/`, формат PNG с альфой плюс WebP рядом. Рабочие материалы: `docs/design/v3/crops/` (вырезки с
эталонов, образец для Codex), `refs/` (исходный реф владельца), `prompts/` (промпты, которыми сделаны экраны).

## Список

| Файл `public/v3/` | Образец `crops/` | Что на нём | Размер на экране, px | Выгрузка, px |
|---|---|---|---|---|
| `cat-ustoz.png` | `cat-ustoz` | птица без круга | 58 | 348 |
| `cat-bobr.png` | `cat-bobr` | голова бобра без круга | 58 | 348 |
| `cat-path.png` | `cat-path` | указатель с травой | 58 | 348 |
| `cat-teach.png` | `cat-teach` | открытая книга | 58 | 348 |
| `hero-bobr-non.png` | `hero-bobr-non` | бобр с лепёшкой, снизу обрезан краем баннера | 250×167 | 1500×1002 |
| `hero-leaves.png` | `leaves` | два листика | 66×58 | 396×348 |
| `card-ustoz.png` | `card-ustoz` | птица с крыльями, снизу обрезана | 128×91 | 768×546 |
| `card-bobr.png` | `card-bobr` | весёлый бобр, снизу обрезан | 126×87 | 756×522 |
| `avatar-ustoz.png` | `avatar-ustoz` | голова птицы для чата | 65 и 46 | 390 |
| `avatar-bobr.png` | `avatar-bobr` | бобр в круге профиля, фон круга бирюзовый отдельно кодом | 152 | 912 |
| `stat-fraction.png` | `stat-fraction` | плитка с дробью 1/2 | 54 | 324 |
| `stat-bird.png` | `stat-bird` | маленькая птица | 58 | 348 |
| `note-duo.png` | `note-duo` | бобр и птица вместе | 130×70 | 780×420 |
| `house-island.png` | `island` | остров с домом **без** чисел, камней-уровней, бобра, птицы и людей | 380×513 | 1520×2052 |
| `house-island-dim.png` | `island` | тот же кадр: дом погас, сад пустой, сухая трава, вода тише, окна тёмные | 380×513 | 1520×2052 |
| `sprite-bobr-dam.png` | `island` | бобр у плотины из брёвен | по кадру | ×4 |
| `sprite-bird.png` | `island` | птица на острове | по кадру | ×4 |
| `sprite-people.png` | `island` | двое соседей | по кадру | ×4 |

Иконки таб-бара, стрелки, шеврон, кнопки настроек, кольцо прогресса, числа на уровнях, лепёшка в чате — код и инлайн-SVG, не картинки.
Лепёшка в чате строится из дроби: это данные.

## Как делать

Сначала пробуй точную вырезку: `crops/<имя>.png` + скилл `task-local-bg-removal`. Края чистые и резкость достаточная — готово.
Иначе перерисовка в Codex с этой вырезкой как образцом:

```bash
cd public/v3
codex exec --skip-git-repo-check --sandbox workspace-write "Generate an image: <описание>. Recreate exactly the object in the attached image: same character, pose, angle, colours, soft clay 3D look and lighting. Do not redesign it, add nothing. Output a clean high-resolution cutout on a fully transparent background (PNG with alpha channel, no backdrop, no shadow plate). Save it as <файл>.png in the current directory." -i ../../docs/design/v3/crops/<имя>.png </dev/null
```

`</dev/null` обязателен: без него codex висит на «Reading additional input from stdin». Промпт идёт до `-i`. Запускай до 4
параллельно. Для острова в образец добавь `-i ../../docs/design/v3/2-house.png`.

## Проверка каждого файла

Скрипт на PIL: `mode == "RGBA"`, углы прозрачные, нет светлого ореола по контуру на фоне `#fde6ce`, размер не меньше выгрузки или
сверка на глаз при показе в реальном размере. Лист всех ассетов на тёплом фоне показать владельцу до того, как экран примет их
как окончательные. Пока файла нет, экран использует вырезку из `crops/` по тому же имени, чтобы сетка не ждала арт.
