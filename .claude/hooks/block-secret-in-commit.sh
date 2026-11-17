#!/usr/bin/env bash
# block-secret-in-commit: не пустить в коммит файл, где ключ лежит значением.
# s206: коммит чужих настроек проверили грепом по известным форматам (sk-, ghp_, AKIA)
# и написали «секретов нет». В .codex/config.toml лежал OBSIDIAN_API_KEY = "<64 hex>" —
# формат незнакомый, регистр верхний, шаблон мимо. Ключ ушёл в историю ветки.
# Поэтому здесь ищем не формат ключа, а ФОРМУ «имя-с-ключом = длинное значение».
# PreToolUse/Bash. Решает по добавленным строкам staged-диффа (`git commit -a` без add не видит).
set -uo pipefail
input=$(cat)
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$ROOT" || exit 0

# «git commit» ищем в самой команде, не в теле heredoc. Тела вырезаем целиком
# (от строки с `<<X` до строки `X`), а не всё после первого `<<`: s234 отрезка
# `${cmd%%<<*}` пропустила `python3 - <<'EOF' … EOF` && `git commit` без проверки.
cmd=$(printf '%s' "$input" | python3 -c '
import sys, json, re
c = json.load(sys.stdin).get("tool_input", {}).get("command", "")
out, end = [], None
for line in c.split("\n"):
    if end is not None:
        if line.strip() == end: end = None
        continue
    out.append(line)
    m = re.search(r"(?<!<)<<-?\s*[\x27\"]?([A-Za-z_][A-Za-z0-9_]*)[\x27\"]?", line)
    if m: end = m.group(1)
print("\n".join(out))' 2>/dev/null)
printf '%s' "$cmd" | grep -qE '\bgit[[:space:]]+commit\b' || exit 0

staged=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null)
# `git add <пути> && git commit` и `git commit -a`: в момент хука файлы ещё не в индексе —
# смотрим и рабочее дерево по этим путям (иначе ключ уезжает без проверки).
addpaths=$(printf '%s' "$cmd" | python3 -c '
import re, shlex, sys
c = sys.stdin.read(); out = []
for seg in re.split(r"&&|\|\||;|\n", c):
    try: w = shlex.split(seg)
    except ValueError: continue
    if w[:2] == ["git", "add"]:
        out += [x for x in w[2:] if not x.startswith("-")]
    if w[:2] == ["git", "commit"] and any(re.fullmatch(r"-[a-zA-Z]*a[a-zA-Z]*", x) or x == "--all" for x in w[2:]):
        out.append(".")
print("\n".join(out))' 2>/dev/null)
WORKTREE_FILES=""
if [ -n "$addpaths" ]; then
  WORKTREE_FILES=$( { printf '%s\n' "$addpaths" | while read -r p; do [ -n "$p" ] && git diff --name-only --diff-filter=ACM -- "$p"; done
                      printf '%s\n' "$addpaths" | while read -r p; do [ -n "$p" ] && git ls-files --others --exclude-standard -- "$p"; done; } | sort -u)
fi
export WORKTREE_FILES
[ -n "$staged$WORKTREE_FILES" ] || exit 0

STAGED="$staged" python3 - <<'PY'
import json, os, re, subprocess

# Форма, а не формат: имя намекает на секрет, справа — длинное непробельное значение.
NAME = r'[A-Za-z0-9_.-]*(?:api[_-]?key|secret|token|password|passwd|credential|access[_-]?key|private[_-]?key)[A-Za-z0-9_.-]*'
LINE = re.compile(rf'(?i)\b({NAME})\b\s*[:=]\s*["\']?([A-Za-z0-9_\-+/=.~]{{20,}})["\']?')
BEGIN_KEY = re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----')

# Учебные примеры, заглушки и ссылки на переменные — не секреты.
FAKE = re.compile(r'(?i)example|placeholder|changeme|your[_-]?|dummy|sample|n0t[_-]?a[_-]?real|not[_-]?a[_-]?real|fake|xxxx|\.\.\.|<[^>]+>|\$\{|os\.environ|getenv|process\.env|settings\.|config\.|redacted')
SKIP_DIR = ('.agents/skills/',)          # чужая библиотека навыков: примеры ключей в документации
SKIP_NAME = ('.env.example', '.env.production.example')

hits = []
work = set(os.environ.get("WORKTREE_FILES", "").split())
for path in sorted(set(os.environ["STAGED"].splitlines()) | work):
    if path.startswith(SKIP_DIR) or os.path.basename(path) in SKIP_NAME:
        continue
    # Только добавленные строки: s244 хук держал за ключ давно закоммиченную строку
    # файла, который правили рядом (3 из 3 блоков в аудите 2026-10 — ложные).
    if path in work and not subprocess.run(["git", "ls-files", "--error-unmatch", path], capture_output=True).returncode == 0:
        # новый файл, ещё не в индексе: всё содержимое — добавленные строки
        blob = subprocess.run(["git", "diff", "--no-index", "-U0", "--no-color", "/dev/null", path], capture_output=True)
        blob.returncode = 0
    elif path in work:
        blob = subprocess.run(["git", "diff", "HEAD", "-U0", "--no-color", "--", path], capture_output=True)
    else:
        blob = subprocess.run(["git", "diff", "--cached", "-U0", "--no-color", "--", path], capture_output=True)
    if blob.returncode != 0:
        continue
    try:
        diff = blob.stdout.decode("utf-8")
    except UnicodeDecodeError:
        continue            # бинарник не читаем
    added, n = [], 0
    for d in diff.splitlines():
        h = re.match(r"@@ -\S+ \+(\d+)", d)
        if h:
            n = int(h.group(1)); continue
        if d.startswith("+") and not d.startswith("+++"):
            added.append((n, d[1:])); n += 1
    for n, line in added:
        if len(line) > 4000:
            continue
        if BEGIN_KEY.search(line):
            hits.append((path, n, "приватный ключ", ""))
            continue
        m = LINE.search(line)
        # Значение, за которым сразу идёт `(`, — ВЫЗОВ, а не литерал:
        # `password = SchoolAccessGenerator.generate_password()` хук держал за
        # 39-символьный ключ, потому что скобки в класс значения не входят и
        # совпадение обрывалось перед ними. Настоящий секрет за собой `(` не
        # тянет, так что берег от этого не тоньше.
        if m and line[m.end() : m.end() + 1] == "(":
            m = None
        # Значение БЕЗ кавычек, за которым сразу `,` `;` `)`, — ссылка в коде
        # (аргумент, присваивание поля), а не литерал: s234 хук держал за ключ
        # константу `max_completion_tokens=MENTOR_MAX_COMPLETION_TOKENS,` и поле
        # `this.refreshToken = tokens.refresh_token;`. Ключи в .env/YAML/JSON лежат
        # в кавычках или до конца строки — их это не снимает.
        if m and line[m.start(2) - 1] not in "\"'" and line[m.end() : m.end() + 1] in (",", ";", ")"):
            m = None
        # Значение БЕЗ кавычек и без единой цифры, только из букв, `_` и `.`, —
        # имя: тип, атрибут, переменная. s236 хук держал за ключ аннотацию
        # `credentials: HTTPAuthorizationCredentials | None,` и поле
        # `stream_secret = self.media.stream_secret`. Настоящие ключи несут цифры;
        # значения в кавычках и с цифрами это не снимает.
        if m and line[m.start(2) - 1] not in "\"'" and re.fullmatch(r"[A-Za-z_.]+", m.group(2)):
            m = None
        if m and not FAKE.search(line):
            value = m.group(2)
            shown = f"{value[:4]}…{value[-2:]} ({len(value)} символов)"
            hits.append((path, n, m.group(1), shown))

if not hits:
    raise SystemExit(0)

lines = ["🔴 В staged-файлах значение, похожее на настоящий ключ. Коммит остановлен.", ""]
for path, n, name, shown in hits[:12]:
    lines.append(f"  {path}:{n} — {name} = {shown}" if shown else f"  {path}:{n} — {name}")
if len(hits) > 12:
    lines.append(f"  … и ещё {len(hits) - 12}")
lines += [
    "",
    "Так в s206 в историю ушёл OBSIDIAN_API_KEY: проверка искала известные форматы (sk-, ghp_, AKIA),",
    "а ключ был просто длинной строкой справа от имени. Формат искать бесполезно — ищем форму.",
    "",
    "Что сделать:",
    "  1. Открой файл и посмотри глазами: это настоящий ключ или пример из документации.",
    "  2. Настоящий — убери его из коммита (git restore --staged <файл>), внеси файл в .gitignore,",
    "     значение держи в .env. Если ключ уже ушёл в историю — скажи владельцу, он решает про ревок.",
    "  3. Пример или заглушка — перепиши значение так, чтобы оно читалось как пример",
    "     (EXAMPLE, your-key-here, ${VAR}), либо назови путь в SKIP_DIR этого хука.",
    "",
    "Хук: .claude/hooks/block-secret-in-commit.sh",
]
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "\n".join(lines),
}}, ensure_ascii=False))
PY
exit 0
