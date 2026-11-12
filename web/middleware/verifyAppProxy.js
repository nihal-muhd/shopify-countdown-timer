import { verifyProxySignature } from "../lib/verifyProxySignature.js";
import { HttpError } from "./errorHandler.js";

const SHOP_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

function getRawQueryString(originalUrl) {
  const queryStart = originalUrl.indexOf("?");
  return queryStart === -1 ? "" : originalUrl.slice(queryStart + 1);
}

export function verifyAppProxy(req, res, next) {
  const queryString = getRawQueryString(req.originalUrl);
  const shop = new URLSearchParams(queryString).get("shop");

  const isTrustedRequest =
    verifyProxySignature(queryString, process.env.SHOPIFY_API_SECRET) &&
    SHOP_DOMAIN_PATTERN.test(shop ?? "");

  if (!isTrustedRequest) {
    return next(new HttpError(401, "Invalid proxy signature"));
  }

  res.locals.proxyShop = shop;
  return next();
}
