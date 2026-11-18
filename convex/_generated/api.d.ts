/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as botAuth from "../botAuth.js";
import type * as conductor from "../conductor.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as demo from "../demo.js";
import type * as lesson from "../lesson.js";
import type * as lessonView from "../lessonView.js";
import type * as linkCode from "../linkCode.js";
import type * as llmCache from "../llmCache.js";
import type * as outbox from "../outbox.js";
import type * as parent from "../parent.js";
import type * as parentLogin from "../parentLogin.js";
import type * as parents from "../parents.js";
import type * as students from "../students.js";
import type * as turn from "../turn.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  botAuth: typeof botAuth;
  conductor: typeof conductor;
  crons: typeof crons;
  debug: typeof debug;
  demo: typeof demo;
  lesson: typeof lesson;
  lessonView: typeof lessonView;
  linkCode: typeof linkCode;
  llmCache: typeof llmCache;
  outbox: typeof outbox;
  parent: typeof parent;
  parentLogin: typeof parentLogin;
  parents: typeof parents;
  students: typeof students;
  turn: typeof turn;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
