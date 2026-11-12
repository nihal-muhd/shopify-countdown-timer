import { createHmac, timingSafeEqual } from "crypto";

const SIGNATURE_PARAM = "signature";
export const DEFAULT_MAX_AGE_SECONDS = 300;

function toSignableMessage(searchParams) {
  const valuesByKey = new Map();
  for (const [key, value] of searchParams) {
    if (key === SIGNATURE_PARAM) {
      continue;
    }
    valuesByKey.set(key, [...(valuesByKey.get(key) ?? []), value]);
  }
  return [...valuesByKey]
    .map(([key, values]) => `${key}=${values.join(",")}`)
    .sort()
    .join("");
}

export function computeProxySignature(searchParams, apiSecret) {
  return createHmac("sha256", apiSecret)
    .update(toSignableMessage(searchParams))
    .digest("hex");
}

function isSameSignature(receivedSignature, expectedSignature) {
  const receivedBuffer = Buffer.from(receivedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function isRecent(timestampSeconds, now, maxAgeSeconds) {
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }
  const ageSeconds = Math.abs(now / 1000 - timestampSeconds);
  return ageSeconds <= maxAgeSeconds;
}

export function verifyProxySignature(
  queryString,
  apiSecret,
  { now = Date.now(), maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS } = {},
) {
  if (!apiSecret) {
    return false;
  }

  const searchParams = new URLSearchParams(queryString);
  const receivedSignature = searchParams.get(SIGNATURE_PARAM);
  if (!receivedSignature) {
    return false;
  }

  const expectedSignature = computeProxySignature(searchParams, apiSecret);
  if (!isSameSignature(receivedSignature, expectedSignature)) {
    return false;
  }

  return isRecent(Number(searchParams.get("timestamp")), now, maxAgeSeconds);
}
