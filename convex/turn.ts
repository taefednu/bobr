// TODO: action turn {sessionId, input} — поток одного хода из спеки (preGuard → guard ∥ шаг → Conductor → postChecks → outputCheck).
// Action не пишет в БД сам: только ctx.runMutation(internal.conductor.*).
export {};
