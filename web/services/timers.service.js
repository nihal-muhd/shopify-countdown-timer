import mongoose from "mongoose";
import { Timer } from "../models/Timer.js";

function isValidTimerId(timerId) {
  return mongoose.isValidObjectId(timerId);
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
  return timer.toObject();
}

export async function deleteTimer(shop, timerId) {
  if (!isValidTimerId(timerId)) {
    return false;
  }
  const result = await Timer.deleteOne({ _id: timerId, shop });
  return result.deletedCount > 0;
}
