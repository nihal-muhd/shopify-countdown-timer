import * as timersService from "../services/timers.service.js";
import { pickTimerForProduct } from "../lib/timerLogic.js";
import { HttpError } from "../middleware/errorHandler.js";

const TIMER_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";
const NUMERIC_ID_PATTERN = /^\d+$/;
const MAX_COLLECTION_IDS = 250;

function readSingleQueryValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readProductFromQuery(query) {
  const productId = readSingleQueryValue(query.product_id);
  const collectionIds = readSingleQueryValue(query.collection_ids)
    .split(",")
    .map((collectionId) => collectionId.trim())
    .filter(Boolean);

  const isValid =
    NUMERIC_ID_PATTERN.test(productId) &&
    collectionIds.length <= MAX_COLLECTION_IDS &&
    collectionIds.every((collectionId) =>
      NUMERIC_ID_PATTERN.test(collectionId),
    );

  return isValid ? { productId, collectionIds } : null;
}

function toStorefrontTimer(timer) {
  const { bgColor, textColor, position, headline, urgencyMinutes } =
    timer.style;
  const displayFields = {
    id: String(timer._id),
    type: timer.type,
    style: { bgColor, textColor, position, headline, urgencyMinutes },
  };

  if (timer.type === "fixed") {
    return { ...displayFields, endAt: timer.endAt };
  }
  return { ...displayFields, durationMinutes: timer.durationMinutes };
}

export async function getTimerForProduct(req, res) {
  const product = readProductFromQuery(req.query);
  if (!product) {
    throw new HttpError(
      400,
      "product_id must be a numeric id and collection_ids a comma-separated list of numeric ids",
    );
  }

  const timers = await timersService.listEnabledTimersForStorefront(
    res.locals.proxyShop,
  );
  const timer = pickTimerForProduct(timers, product);

  res.set("Cache-Control", TIMER_CACHE_CONTROL);
  if (!timer) {
    return res.status(204).end();
  }
  return res.status(200).json({ timer: toStorefrontTimer(timer) });
}

export async function recordImpression(req, res) {
  res.set("Cache-Control", "no-store");
  const wasCounted = await timersService.incrementImpressions(
    res.locals.proxyShop,
    req.params.id,
  );
  if (!wasCounted) {
    throw new HttpError(404, "Timer not found");
  }
  return res.status(204).end();
}
