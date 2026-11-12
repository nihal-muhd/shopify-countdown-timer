import mongoose from "mongoose";
import { Timer } from "../models/Timer.js";

const STOREFRONT_FIELDS =
  "type startAt endAt durationMinutes targetType productIds collectionIds style isEnabled createdAt";
const STOREFRONT_CACHE_TTL_MS = 60 * 1000;
const MAX_CACHED_SHOPS = 1000;
const storefrontTimersByShop = new Map();

function isValidTimerId(timerId) {
  return mongoose.isValidObjectId(timerId);
}

function clearStorefrontCache(shop) {
  storefrontTimersByShop.delete(shop);
}

function rememberStorefrontTimers(shop, timers, now) {
  clearStorefrontCache(shop);
  if (storefrontTimersByShop.size >= MAX_CACHED_SHOPS) {
    const oldestShop = storefrontTimersByShop.keys().next().value;
    storefrontTimersByShop.delete(oldestShop);
  }
  storefrontTimersByShop.set(shop, {
    timers,
    expiresAt: now + STOREFRONT_CACHE_TTL_MS,
  });
}

export async function listEnabledTimersForStorefront(shop, now = Date.now()) {
  const cached = storefrontTimersByShop.get(shop);
  if (cached && cached.expiresAt > now) {
    return cached.timers;
  }
  const timers = await Timer.find({ shop, isEnabled: true })
    .select(STOREFRONT_FIELDS)
    .lean();
  rememberStorefrontTimers(shop, timers, now);
  return timers;
}

export async function incrementImpressions(shop, timerId) {
  if (!isValidTimerId(timerId)) {
    return false;
  }
  const result = await Timer.updateOne(
    { _id: timerId, shop, isEnabled: true },
    { $inc: { impressions: 1 } },
  );
  return result.matchedCount > 0;
}

export async function listTimers(shop) {
  return Timer.find({ shop }).sort({ createdAt: -1 }).lean();
}

export async function getTimer(shop, timerId) {
  if (!isValidTimerId(timerId)) {
    return null;
  }
  return Timer.findOne({ _id: timerId, shop }).lean();
}

export async function createTimer(shop, timerFields) {
  const timer = await Timer.create({ ...timerFields, shop });
  clearStorefrontCache(shop);
  return timer.toObject();
}

export async function updateTimer(shop, timerId, timerFields) {
  if (!isValidTimerId(timerId)) {
    return null;
  }
  const timer = await Timer.findOne({ _id: timerId, shop });
  if (!timer) {
    return null;
  }
  timer.set({ ...timerFields, shop });
  await timer.save();
  clearStorefrontCache(shop);
  return timer.toObject();
}

export async function deleteTimer(shop, timerId) {
  if (!isValidTimerId(timerId)) {
    return false;
  }
  const result = await Timer.deleteOne({ _id: timerId, shop });
  clearStorefrontCache(shop);
  return result.deletedCount > 0;
}
