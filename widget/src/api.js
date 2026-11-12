const TIMER_CACHE_TTL_MS = 60 * 1000;
const STORAGE_PREFIX = "countdown-timer";

function readSessionValue(key) {
  try {
    const rawValue = sessionStorage.getItem(key);
    return rawValue === null ? null : JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function buildTimerUrl(proxyBase, productId, collectionIds) {
  const params = new URLSearchParams({ product_id: productId });
  if (collectionIds) {
    params.set("collection_ids", collectionIds);
  }
  return `${proxyBase}/timer?${params}`;
}

export async function fetchTimer({ proxyBase, productId, collectionIds }) {
  const cacheKey = `${STORAGE_PREFIX}:timer:${productId}:${collectionIds}`;
  const cached = readSessionValue(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.timer;
  }

  const response = await fetch(
    buildTimerUrl(proxyBase, productId, collectionIds),
    { headers: { Accept: "application/json" } },
  );

  let timer = null;
  if (response.status === 200) {
    timer = (await response.json()).timer ?? null;
  } else if (response.status !== 204) {
    throw new Error(`Timer request failed with status ${response.status}`);
  }

  writeSessionValue(cacheKey, {
    timer,
    expiresAt: Date.now() + TIMER_CACHE_TTL_MS,
  });
  return timer;
}

export function sendImpressionOnce(proxyBase, timerId) {
  const sentKey = `${STORAGE_PREFIX}:impression:${timerId}`;
  if (readSessionValue(sentKey)) {
    return;
  }
  writeSessionValue(sentKey, true);

  fetch(`${proxyBase}/impression/${encodeURIComponent(timerId)}`, {
    method: "POST",
    keepalive: true,
  }).catch(() => undefined);
}
