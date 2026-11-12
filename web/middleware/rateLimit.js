import { isIP } from "net";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { HttpError } from "./errorHandler.js";

const ONE_MINUTE_MS = 60 * 1000;

function getClientIp(req) {
  const forwardedFor = req.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0].trim();
  if (firstForwardedIp && isIP(firstForwardedIp)) {
    return firstForwardedIp;
  }
  return req.ip ?? "unknown";
}

function shopAndClientKey(req, res) {
  const clientIp = getClientIp(req);
  const clientKey = isIP(clientIp) ? ipKeyGenerator(clientIp) : clientIp;
  return `${res.locals.proxyShop}:${clientKey}`;
}

function rejectAsTooManyRequests(req, res, next) {
  next(new HttpError(429, "Too many requests"));
}

function createProxyLimiter(maxRequestsPerMinute) {
  return rateLimit({
    windowMs: ONE_MINUTE_MS,
    limit: maxRequestsPerMinute,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: shopAndClientKey,
    handler: rejectAsTooManyRequests,
    validate: { xForwardedForHeader: false },
  });
}

export const timerLookupLimiter = createProxyLimiter(120);
export const impressionLimiter = createProxyLimiter(30);
