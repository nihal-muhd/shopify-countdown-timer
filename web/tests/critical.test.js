import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  TIMER_STATUS,
  getEvergreenRemaining,
  getTimerStatus,
  matchesTarget,
  pickTimerForProduct,
} from "../lib/timerLogic.js";
import { timerInputSchema } from "../validators/timer.schema.js";
import { verifyProxySignature } from "../lib/verifyProxySignature.js";

const NOW = new Date("2026-06-15T12:00:00Z");
const ONE_MINUTE_MS = 60 * 1000;

function fixedTimer(overrides = {}) {
  return {
    type: "fixed",
    isEnabled: true,
    startAt: "2026-06-01T00:00:00Z",
    endAt: "2026-06-30T00:00:00Z",
    targetType: "all",
    productIds: [],
    collectionIds: [],
    ...overrides,
  };
}

describe("critical business logic", () => {
  it("1. timer status is scheduled, active or expired at the right moments", () => {
    const startsTomorrow = fixedTimer({ startAt: "2026-06-16T00:00:00Z" });
    const runningNow = fixedTimer();
    const endsExactlyNow = fixedTimer({ endAt: NOW.toISOString() });

    expect(getTimerStatus(startsTomorrow, NOW)).toBe(TIMER_STATUS.SCHEDULED);
    expect(getTimerStatus(runningNow, NOW)).toBe(TIMER_STATUS.ACTIVE);
    expect(getTimerStatus(endsExactlyNow, NOW)).toBe(TIMER_STATUS.EXPIRED);
  });

  it("2. a timer only targets its listed products or collections", () => {
    const gardenProduct = { productId: 111, collectionIds: ["900"] };
    const productTimer = fixedTimer({
      targetType: "products",
      productIds: ["111"],
    });
    const gardenTimer = fixedTimer({
      targetType: "collections",
      collectionIds: ["900"],
    });
    const otherCollectionTimer = fixedTimer({
      targetType: "collections",
      collectionIds: ["999"],
    });

    expect(matchesTarget(productTimer, gardenProduct)).toBe(true);
    expect(matchesTarget(gardenTimer, gardenProduct)).toBe(true);
    expect(matchesTarget(otherCollectionTimer, gardenProduct)).toBe(false);
  });

  it("3. the most specific timer wins: product, then collection, then all products", () => {
    const product = { productId: "111", collectionIds: ["900"] };
    const storeWide = fixedTimer({ title: "store-wide" });
    const garden = fixedTimer({
      title: "garden",
      targetType: "collections",
      collectionIds: ["900"],
    });
    const thisProduct = fixedTimer({
      title: "this-product",
      targetType: "products",
      productIds: ["111"],
    });

    expect(
      pickTimerForProduct([storeWide, garden, thisProduct], product, NOW).title,
    ).toBe("this-product");
    expect(pickTimerForProduct([storeWide, garden], product, NOW).title).toBe(
      "garden",
    );
  });

  it("4. an evergreen timer continues for a returning visitor and resets after it ends", () => {
    const firstSeenAt = NOW.getTime();
    const tenMinutesLater = firstSeenAt + 10 * ONE_MINUTE_MS;
    const thirtyOneMinutesLater = firstSeenAt + 31 * ONE_MINUTE_MS;

    const returning = getEvergreenRemaining(
      String(firstSeenAt),
      30,
      tenMinutesLater,
    );
    expect(returning.remainingMs).toBe(20 * ONE_MINUTE_MS);
    expect(returning.hasReset).toBe(false);

    const afterExpiry = getEvergreenRemaining(
      String(firstSeenAt),
      30,
      thirtyOneMinutesLater,
    );
    expect(afterExpiry.remainingMs).toBe(30 * ONE_MINUTE_MS);
    expect(afterExpiry.hasReset).toBe(true);
  });

  it("5. admin input is cleaned, and invalid input is rejected with the field name", () => {
    const cleaned = timerInputSchema.parse({
      title: "<b>Summer</b> Sale",
      type: "fixed",
      startAt: "2026-06-01T00:00:00Z",
      endAt: "2026-06-30T00:00:00Z",
      targetType: "all",
      shop: "someone-else.myshopify.com",
    });
    expect(cleaned.title).toBe("Summer Sale");
    expect(cleaned).not.toHaveProperty("shop");

    const endBeforeStart = timerInputSchema.safeParse({
      title: "Broken sale",
      type: "fixed",
      startAt: "2026-06-30T00:00:00Z",
      endAt: "2026-06-01T00:00:00Z",
      targetType: "all",
    });
    expect(endBeforeStart.success).toBe(false);
    expect(endBeforeStart.error.issues[0].path).toEqual(["endAt"]);
  });

  it("6. a storefront request signed by Shopify passes, and a tampered one fails", () => {
    const secret = "test-app-secret";
    const params = {
      shop: "demo.myshopify.com",
      path_prefix: "/apps/countdown",
      timestamp: String(Math.floor(NOW.getTime() / 1000)),
      product_id: "111",
    };
    const signedMessage = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join("");
    const signature = createHmac("sha256", secret)
      .update(signedMessage)
      .digest("hex");
    const genuineQuery = new URLSearchParams({
      ...params,
      signature,
    }).toString();
    const tamperedQuery = genuineQuery.replace(
      "product_id=111",
      "product_id=999",
    );
    const options = { now: NOW.getTime() };

    expect(verifyProxySignature(genuineQuery, secret, options)).toBe(true);
    expect(verifyProxySignature(tamperedQuery, secret, options)).toBe(false);
  });
});
