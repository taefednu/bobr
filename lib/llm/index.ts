// Слой вызова Claude (stage 2). Вызывается только из Convex actions; скилл bobr-llm-call.
export * from "./call";
export * from "./postChecks";
export * from "./component";
export { fence, fenceChildInput } from "./prompts/fence";
export { USTOZ_PREFIX } from "./prompts/ustoz";
export { GUARD_PREFIX } from "./prompts/guard";
export { OUTPUT_CHECK_PREFIX } from "./prompts/outputCheck";
export * from "./prompts/tails";
