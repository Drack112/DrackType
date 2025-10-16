import { z, ZodSchema } from "zod";
import { RateLimitIds, RateLimiterId } from "../rate-limit";
import { RequireConfiguration } from "../require-configuration";

export type OpenApiTag =
  | "configs"
  | "presets"
  | "ape-keys"
  | "admin"
  | "psas"
  | "public"
  | "leaderboards"
  | "results"
  | "configuration"
  | "development"
  | "users"
  | "quotes"
  | "webhooks";

export type PermissionId =
  | "quoteMod"
  | "canReport"
  | "canManageApeKeys"
  | "admin";

export type EndpointMetadata = {
  /** Authentication options, by default a bearer token is required. */
  authenticationOptions?: RequestAuthenticationOptions;

  openApiTags?: OpenApiTag | OpenApiTag[];

  /** RateLimitId or RateLimitIds.
   * Only specifying RateLimiterId will use  a default limiter with 30 requests/minute for ApeKey requests.
   */
  rateLimit?: RateLimiterId | RateLimitIds;

  /** Role/Rples needed to  access the endpoint*/
  requirePermission?: PermissionId | PermissionId[];

  /** Endpoint is only available if configuration allows it */
  requireConfiguration?: RequireConfiguration | RequireConfiguration[];
};

/**
 *
 * @param meta Ensure the type of metadata is `EndpointMetadata`.
 * Ts-rest does not allow to specify the type of `metadata`.
 * @returns
 */
export function meta(meta: EndpointMetadata): EndpointMetadata {
  return meta;
}

export type RequestAuthenticationOptions = {
  /** Endpoint is accessible without any authentication. If `false` bearer authentication is required. */
  isPublic?: boolean;
  /** Endpoint is accessible with ape key authentication in  _addition_ to the bearer authentication. */
  acceptApeKeys?: boolean;
  /** Endpoint requires an authentication token which is younger than one minute.  */
  requireFreshToken?: boolean;
  noCache?: boolean;
  /** Allow unauthenticated requests on dev  */
  isPublicOnDev?: boolean;
  /** Endpoint is a webhook only to be called by Github */
  isGithubWebhook?: boolean;
};

export const DrackResponseSchema = z.object({
  message: z.string(),
});
export type DrackResponseType = z.infer<typeof DrackResponseSchema>;

export const DrackValidationErrorSchema = DrackResponseSchema.extend({
  validationErrors: z.array(z.string()),
});
export type DrackValidationError = z.infer<typeof DrackValidationErrorSchema>;

export const DrackClientError = DrackResponseSchema;
export const DrackServerError = DrackClientError.extend({
  errorId: z.string(),
  uid: z.string().optional(),
});
export type DrackServerErrorType = z.infer<typeof DrackServerError>;

export function responseWithNullableData<T extends ZodSchema>(
  dataSchema: T
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof DrackResponseSchema.shape,
    {
      data: z.ZodNullable<T>;
    }
  >
> {
  return DrackResponseSchema.extend({
    data: dataSchema.nullable(),
  });
}

export function responseWithData<T extends ZodSchema>(
  dataSchema: T
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof DrackResponseSchema.shape,
    {
      data: T;
    }
  >
> {
  return DrackResponseSchema.extend({
    data: dataSchema,
  });
}

export const CommonResponses = {
  400: DrackClientError.describe("Generic client error"),
  401: DrackClientError.describe(
    "Authentication required but not provided or invalid"
  ),
  403: DrackClientError.describe("Operation not permitted"),
  422: DrackValidationErrorSchema.describe("Request validation failed"),
  429: DrackClientError.describe("Rate limit exceeded"),
  470: DrackClientError.describe("Invalid ApeKey"),
  471: DrackClientError.describe("ApeKey is inactive"),
  472: DrackClientError.describe("ApeKey is malformed"),
  479: DrackClientError.describe("ApeKey rate limit exceeded"),
  500: DrackServerError.describe("Generic server error"),
  503: DrackServerError.describe(
    "Endpoint disabled or server is under maintenance"
  ),
};
