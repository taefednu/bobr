#!/usr/bin/env bash
# Smoke одного урока на ЛОКАЛЬНОМ Convex (npx convex run). Без ключа LLM не вызывается: replay/запасной путь.
# Падает на первом провале. Если :3210 не слушает — поднимает `convex dev` и гасит ровно его группу процессов.
set -uo pipefail
cd "$(dirname "$0")/.."
. scripts/node22.sh
export CONVEX_AGENT_MODE=anonymous
LOG=$(mktemp); DEV_PID=""
cleanup() { [ -n "$DEV_PID" ] && kill -- "-$DEV_PID" 2>/dev/null; rm -f "$LOG"; }
trap cleanup EXIT

if ! (exec 3<>/dev/tcp/127.0.0.1/3210) 2>/dev/null; then
  setsid npx convex dev </dev/null >"$LOG" 2>&1 & DEV_PID=$!
  for _ in $(seq 1 90); do grep -q "ready" "$LOG" && break; sleep 2; done
  grep -q "ready" "$LOG" || { echo "FAIL  convex dev не поднялся"; tail -20 "$LOG"; exit 1; }
fi

run() { npx convex run "$@" 2>/dev/null; }                 # run <fn> '<json>'
js() { node -e "const d=JSON.parse(process.argv[1]);const r=($2);process.stdout.write(String(r))" "$1"; }
STEP=0
ok() { STEP=$((STEP+1)); echo "PASS  $STEP. $1"; }
bad() { echo "FAIL  $((STEP+1)). $1 ($2)"; exit 1; }
eq() { [ "$2" = "$3" ] && ok "$1" || bad "$1" "got '$2', want '$3'"; }
ans() {
  local payload who="{\"token\":\"$1\"}"
  payload=$(js "$(run lesson:view "$who")" "JSON.stringify({ ...$who, input:{type:'answer',value:'$2',...(d.socratic?{taskInstanceId:d.socratic.taskInstanceId,requestId:require('node:crypto').randomUUID()}:{})}})")
  run turn:turn "$payload" >/dev/null
}
view() { run lesson:view "{\"token\":\"$1\"}"; }
snap() { run debug:snapshot "{\"token\":\"$1\"}"; }
unq() { tr -d '"\r\n '; }
noleak() { # ключей answer/distractors нет нигде в JSON
  js "$1" '(function f(o){return o&&typeof o==="object"&&Object.entries(o).some(([k,v])=>k==="answer"||k==="distractors"||f(v))})(d)'; }

A=$(js "$(run conductor:startDemoLesson '{"lang":"uz"}')" d.token)
[ -n "$A" ] && ok "startDemoLesson -> session token" || bad "startDemoLesson" "no token"
ans "$A" "2/5"; V=$(view "$A")
eq "2/5 -> lastVerdict misconception:M9" "$(js "$V" d.lastVerdict)" "misconception:M9"
T1=$(js "$V" 'JSON.stringify(d.task.params)')
ans "$A" "2/5"; eq "same task, 2/5 again: streak stays 0" "$(js "$(snap "$A")" d.streak)" "0"
eq "same task still current" "$(js "$(view "$A")" 'JSON.stringify(d.task.params)')" "$T1"
ID1=$(js "$(snap "$A")" d.taskId)
ans "$A" "5/6"; V=$(view "$A"); S=$(snap "$A")
eq "5/6 -> verdict ok" "$(js "$V" d.lastVerdict)" "ok"
[ "$(js "$S" d.taskId)" != "$ID1" ] && ok "new task id ($ID1 -> $(js "$S" d.taskId))" || bad "new task id" "unchanged"
eq "view has no answer/distractors keys" "$(noleak "$V")" "false"

B=$(js "$(run conductor:startDemoLesson '{"lang":"uz"}')" d.token)
for i in 1 2 3; do ans "$B" "$(js "$(snap "$B")" d.answer)"; done
S=$(snap "$B")
eq "3 clean correct on different tasks: N9 solved_self" "$(js "$S" d.level)" "solved_self"
eq "house built" "$(js "$S" d.house)" "built"

C=$(js "$(run conductor:startDemoLesson '{"lang":"uz"}')" d.token)
run turn:turn "{\"token\":\"$C\",\"input\":{\"type\":\"hint\",\"value\":\"\"}}" >/dev/null
eq "hint press -> hintLevel 1" "$(js "$(view "$C")" d.hintLevel)" "1"
run turn:turn "{\"token\":\"$C\",\"input\":{\"type\":\"text\",\"value\":\"хочу умереть\"}}" >/dev/null
V=$(view "$C")
eq "crisis text -> crisis in view" "$(js "$V" 'd.crisis!==null&&d.state')" "CRISIS"
eq "crisis view has no answer/distractors keys" "$(noleak "$V")" "false"
run conductor:leaveCrisis "{\"token\":\"$C\"}" >/dev/null
V=$(view "$C")
eq "leaveCrisis -> crisis null, state restored" "$(js "$V" 'd.crisis===null&&d.state')" "LESSON_SOLVE"

# Этап 3 по токену: цель → диагностика (ответы демо-пути) → план → махалля → урок из плана.
TOK=$(js "$(run session:startDemo '{"lang":"ru"}')" d.token); T="{\"token\":\"$TOK\"}"
run session:acceptConsent "$T" >/dev/null
run goal:set "{\"token\":\"$TOK\",\"goal\":\"improve\"}" >/dev/null
D="$TOK"
run diagnose:start "$T" >/dev/null
ASKED=""
for _ in 1 2 3 4 5 6 7; do
  V=$(run diagnose:view "$T"); P=$(js "$V" 'd.probe?d.probe.topic:""'); [ -z "$P" ] && break
  ASKED="$ASKED$P "; RIGHT=$(js "$(snap "$D")" d.answer)
  case $P in N9) VAL="2/5";; N8) VAL="3/10";; N2) VAL="$RIGHT";; *) VAL=$(js "$V" "d.probe.options.find(o=>o!=='$RIGHT')");; esac
  [ "$(noleak "$V")" = "false" ] || bad "diagnose:view leaks answer" "$P"
  run diagnose:answer "{\"token\":\"$TOK\",\"probeId\":\"$(js "$V" d.probe.id)\",\"value\":\"$VAL\"}" >/dev/null
done
eq "adaptive probes with demo answers" "$ASKED" "N9 N8 N2 N5 N6 "
eq "plan order" "$(js "$(run plan:view "$T")" 'd.order.map(o=>o.topic).join(">")')" "N8>N6>N5>N9"
run plan:accept "$T" >/dev/null
eq "mahalla next" "$(js "$(run mahalla:view "$T")" d.next)" "N8"
run mahalla:startLesson "{\"token\":\"$TOK\",\"topic\":\"N8\"}" >/dev/null
ID1=$(js "$(snap "$D")" d.taskId)
ans "$D" "$(js "$(snap "$D")" d.answer)"
[ "$(js "$(snap "$D")" d.taskId)" != "$ID1" ] && ok "plan lesson: correct answer -> different task" || bad "plan lesson: next task" "same id $ID1"
run mahalla:startLesson "{\"token\":\"$TOK\",\"topic\":\"N6\"}" >/dev/null
eq "next plan topic starts after a lesson" "$(js "$(run lesson:view "$T")" d.task.topic)" "N6"

echo; echo "ALL $STEP STEPS PASS"
echo "LLM: replay/fallback (NOT RUN) — ANTHROPIC_API_KEY not used; steps with the LLM (Ustoz/guard/outputCheck replies) were not exercised live"
