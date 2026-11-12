import { z } from "zod";
import { stripHtml } from "../lib/sanitize.js";

export const TIMER_LIMITS = Object.freeze({
  titleMaxLength: 100,
  headlineMaxLength: 80,
  maxDurationMinutes: 60 * 24 * 30,
  maxUrgencyMinutes: 60 * 24 * 7,
  maxTargetIds: 250,
});

const SHOPIFY_GID_PREFIX_PATTERN = /^gid:\/\/shopify\/[A-Za-z]+\//;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function sanitizedText(maxLength, fieldLabel) {
  return z
    .string({ error: `${fieldLabel} must be text` })
    .transform(stripHtml)
    .pipe(
      z
        .string()
        .min(1, `${fieldLabel} is required`)
        .max(maxLength, `${fieldLabel} must be at most ${maxLength} characters`)
    );
}

const shopifyId = z
  .union([z.string(), z.number().int().positive()])
  .transform((value) => String(value).trim().replace(SHOPIFY_GID_PREFIX_PATTERN, ""))
  .pipe(z.string().regex(/^\d+$/, "Must be a numeric Shopify id or gid"));

const shopifyIdList = z
  .array(shopifyId)
  .max(TIMER_LIMITS.maxTargetIds, `At most ${TIMER_LIMITS.maxTargetIds} items`)
  .transform((ids) => [...new Set(ids)])
  .default([]);

const hexColor = z.string().regex(HEX_COLOR_PATTERN, "Must be a hex color like #FF0000");

const isoDateTime = z.iso
  .datetime({ offset: true, error: "Must be an ISO 8601 date-time" })
  .transform((value) => new Date(value));

const styleSchema = z
  .object({
    bgColor: hexColor.default("#111827"),
    textColor: hexColor.default("#FFFFFF"),
    position: z.enum(["top", "bottom"]).default("top"),
    headline: sanitizedText(TIMER_LIMITS.headlineMaxLength, "Headline").default(
      "Hurry! Sale ends in"
    ),
    urgencyMinutes: z
      .number()
      .int()
      .min(0)
      .max(TIMER_LIMITS.maxUrgencyMinutes)
      .default(60),
  })
  .prefault({});

const sharedTimerFields = {
  title: sanitizedText(TIMER_LIMITS.titleMaxLength, "Title"),
  targetType: z.enum(["all", "products", "collections"]),
  productIds: shopifyIdList,
  collectionIds: shopifyIdList,
  style: styleSchema,
  isEnabled: z.boolean().default(true),
};

const fixedTimerSchema = z.object({
  ...sharedTimerFields,
  type: z.literal("fixed"),
  startAt: isoDateTime,
  endAt: isoDateTime,
});

const evergreenTimerSchema = z.object({
  ...sharedTimerFields,
  type: z.literal("evergreen"),
  durationMinutes: z
    .number()
    .int("Duration must be whole minutes")
    .min(1, "Duration must be at least 1 minute")
    .max(TIMER_LIMITS.maxDurationMinutes),
});

function checkCrossFieldRules(timer, context) {
  if (timer.type === "fixed" && timer.endAt <= timer.startAt) {
    context.addIssue({
      code: "custom",
      path: ["endAt"],
      message: "End date must be after start date",
    });
  }
  if (timer.targetType === "products" && timer.productIds.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["productIds"],
      message: "Pick at least one product",
    });
  }
  if (timer.targetType === "collections" && timer.collectionIds.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["collectionIds"],
      message: "Pick at least one collection",
    });
  }
}

function toStoredTimerFields(timer) {
  const isFixed = timer.type === "fixed";
  return {
    ...timer,
    startAt: isFixed ? timer.startAt : undefined,
    endAt: isFixed ? timer.endAt : undefined,
    durationMinutes: isFixed ? undefined : timer.durationMinutes,
    productIds: timer.targetType === "products" ? timer.productIds : [],
    collectionIds: timer.targetType === "collections" ? timer.collectionIds : [],
  };
}

export const timerInputSchema = z
  .discriminatedUnion("type", [fixedTimerSchema, evergreenTimerSchema], {
    error: 'Type must be "fixed" or "evergreen"',
  })
  .superRefine(checkCrossFieldRules)
  .transform(toStoredTimerFields);
