/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as blog from "../blog.js";
import type * as contact from "../contact.js";
import type * as debug from "../debug.js";
import type * as lib_auth from "../lib/auth.js";
import type * as projects from "../projects.js";
import type * as resume from "../resume.js";
import type * as seed from "../seed.js";
import type * as skills from "../skills.js";
import type * as uses from "../uses.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  blog: typeof blog;
  contact: typeof contact;
  debug: typeof debug;
  "lib/auth": typeof lib_auth;
  projects: typeof projects;
  resume: typeof resume;
  seed: typeof seed;
  skills: typeof skills;
  uses: typeof uses;
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
