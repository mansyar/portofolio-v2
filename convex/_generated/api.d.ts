/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as blog from "../blog.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_validation from "../lib/validation.js";
import type * as media from "../media.js";
import type * as mediaActions from "../mediaActions.js";
import type * as projects from "../projects.js";
import type * as resume from "../resume.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as sitemap from "../sitemap.js";
import type * as skills from "../skills.js";
import type * as uses from "../uses.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  admin: typeof admin;
  analytics: typeof analytics;
  auth: typeof auth;
  blog: typeof blog;
  contact: typeof contact;
  crons: typeof crons;
  dashboard: typeof dashboard;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/validation": typeof lib_validation;
  media: typeof media;
  mediaActions: typeof mediaActions;
  projects: typeof projects;
  resume: typeof resume;
  seed: typeof seed;
  settings: typeof settings;
  sitemap: typeof sitemap;
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
