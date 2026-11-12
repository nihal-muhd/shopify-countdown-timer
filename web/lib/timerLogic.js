export const TIMER_STATUS = Object.freeze({
  ACTIVE: "active",
  SCHEDULED: "scheduled",
  EXPIRED: "expired",
  DISABLED: "disabled",
});

const TARGET_SPECIFICITY = Object.freeze({
  products: 3,
  collections: 2,
  all: 1,
});

const MILLISECONDS_PER_MINUTE = 60 * 1000;

function toTimestamp(value) {
  if (value === null || value === undefined || value === "") {
    return Number.NaN;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }
  return new Date(value).getTime();
}

function toIdList(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.map(String);
}

export function getTimerStatus(timer, now = new Date()) {
  if (!timer.isEnabled) {
    return TIMER_STATUS.DISABLED;
  }

  if (timer.type === "evergreen") {
    return TIMER_STATUS.ACTIVE;
  }

  const currentTime = toTimestamp(now);
  const startTime = toTimestamp(timer.startAt);
  const endTime = toTimestamp(timer.endAt);

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return TIMER_STATUS.EXPIRED;
  }
  if (currentTime < startTime) {
    return TIMER_STATUS.SCHEDULED;
  }
  if (currentTime >= endTime) {
    return TIMER_STATUS.EXPIRED;
  }
  return TIMER_STATUS.ACTIVE;
}

export function matchesTarget(timer, product) {
  const productId = String(product.productId);
  const productCollectionIds = toIdList(product.collectionIds);

  switch (timer.targetType) {
    case "all":
      return true;
    case "products":
      return toIdList(timer.productIds).includes(productId);
    case "collections":
      return toIdList(timer.collectionIds).some((collectionId) =>
        productCollectionIds.includes(collectionId),
      );
    default:
      return false;
  }
}

function getEndTimeForSorting(timer) {
  if (timer.type === "evergreen") {
    return Number.POSITIVE_INFINITY;
  }
  return toTimestamp(timer.endAt);
}

function compareByPriority(timerA, timerB) {
  const specificityDifference =
    TARGET_SPECIFICITY[timerB.targetType] -
    TARGET_SPECIFICITY[timerA.targetType];
  if (specificityDifference !== 0) {
    return specificityDifference;
  }

  const endTimeA = getEndTimeForSorting(timerA);
  const endTimeB = getEndTimeForSorting(timerB);
  if (endTimeA !== endTimeB) {
    return endTimeA < endTimeB ? -1 : 1;
  }

  const createdTimeA = toTimestamp(timerA.createdAt) || 0;
  const createdTimeB = toTimestamp(timerB.createdAt) || 0;
  return createdTimeB - createdTimeA;
}

export function pickTimerForProduct(timers, product, now = new Date()) {
  const candidates = timers.filter(
    (timer) =>
      getTimerStatus(timer, now) === TIMER_STATUS.ACTIVE &&
      matchesTarget(timer, product),
  );

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort(compareByPriority)[0];
}

export function getEvergreenRemaining(
  firstSeenAt,
  durationMinutes,
  now = Date.now(),
) {
  const currentTime = toTimestamp(now);
  const durationMs = durationMinutes * MILLISECONDS_PER_MINUTE;
  const savedStartTime = toTimestamp(firstSeenAt);

  const hasValidSavedStart =
    Number.isFinite(savedStartTime) && savedStartTime <= currentTime;
  const hasExpired =
    hasValidSavedStart && currentTime - savedStartTime >= durationMs;

  const startedAt =
    hasValidSavedStart && !hasExpired ? savedStartTime : currentTime;
  const endsAt = startedAt + durationMs;

  return {
    startedAt,
    endsAt,
    remainingMs: endsAt - currentTime,
    hasReset: startedAt !== savedStartTime,
  };
}
