---
name: prevent-out-of-order-response-overwrites
description: "Prevention: a fetch keyed on the current selection has no request-sequence guard, so when the user switches faster than the server answers, the SLOW reply lands last and paints the previous selection's data as if it were the current one. Auto-check whenever a useEffect refetches on a changing id and writes the result into state."
allowed-tools:
  - Grep
  - Read
---

# Prevent: опоздавший ответ перетирает свежий

## Класс ошибки

Загрузка привязана к выбору — классу, проекту, ребёнку, вкладке:

```tsx
const reload = useCallback(async () => {
  const state = await Api.getState(classId, projectId);
  setLessons(state.lessons);          // ← кто ответил последним, тот и прав
}, [classId, projectId]);
useEffect(() => { void reload(); }, [reload]);
```

Пользователь щёлкает выбор быстрее, чем отвечает сервер. Запросы уходят по
порядку, **ответы приходят как получится**, и `setLessons` последнего
пришедшего затирает результат последнего отправленного. На экране — данные
класса, с которого пользователь уже ушёл, под заголовком того, на который
пришёл.

Хуже обычной «мигающей» гонки тем, что состояние **выглядит правдоподобно**:
это настоящий ответ настоящего сервера, просто про другую сущность. Никакой
ошибки, никакого пустого экрана — учитель читает чужие замки как свои и жмёт
по ним.

Тот же промах в `finally`: `setLoading(false)` от опоздавшего объявляет
законченной ту загрузку, которая ещё идёт.

## Подтверждённые случаи

| Сессия | Экран | Что видел пользователь |
|---|---|---|
| s173 (Platform) | Раздел «Уроки», переключение класса | Замки чужого класса на выбранном; комментарий в том же файле прямо говорил «чужое состояние хуже пустого», а защиты не было |

## Детект

```bash
# запись результата await в состояние внутри useCallback/useEffect с id в зависимостях
grep -rn -A 6 "await \(Api\|ApiService\)\..*(" src | grep -n "set[A-Z]"
```

Красный флаг: между `await` и `setX(...)` **нет** ни проверки номера запроса,
ни `signal.aborted`, ни флага «компонент ещё жив». Считать, что реквест один,
можно только если выбор не меняется — а он меняется, иначе бы и эффекта не было.

## Правильный код

Отменять запрос лучше, чем игнорировать ответ, — но `AbortSignal` принимает не
всякий клиент. Когда не принимает, хватит номера:

```tsx
const requestSeq = useRef(0);

const reload = useCallback(async () => {
  const seq = ++requestSeq.current;
  try {
    const state = await Api.getState(classId, projectId);
    if (seq !== requestSeq.current) return;      // опоздал — молча уходим
    setLessons(state.lessons);
  } catch (err) {
    if (seq !== requestSeq.current) return;      // и отказ опоздавшего тоже
    setError(...);
  } finally {
    if (seq === requestSeq.current) setLoading(false);
  }
}, [classId, projectId]);
```

Три места, а не одно: успех, отказ и снятие признака загрузки. Забытая ветка
`catch` даёт вторую половину той же ошибки — ошибка ушедшего класса на экране
пришедшего.

## Триггер

Применяй, когда:
- пишешь `useEffect`, который перезапрашивает данные при смене id;
- добавляешь в существующий хук второй источник вызова (сокет, кнопка «обновить»);
- видишь `setLoading(false)` в `finally` рядом с `await` по меняющемуся ключу.

## Чего это НЕ покрывает

Сброс состояния при смене выбора — соседний класс ошибки, он в
`prevent-stale-per-selection-state`. Там проблема в том, что состояние не
почистили; здесь — в том, что его почистили, а потом ответ восстановил.
