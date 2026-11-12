import * as timersService from "../services/timers.service.js";
import { getTimerStatus } from "../lib/timerLogic.js";
import { HttpError } from "../middleware/errorHandler.js";

function getSessionShop(res) {
  return res.locals.shopify.session.shop;
}

function toTimerResponse(timer, now = new Date()) {
  const { _id, __v, shop, ...timerFields } = timer;
  return {
    id: String(_id),
    ...timerFields,
    status: getTimerStatus(timer, now),
  };
}

function timerNotFound() {
  return new HttpError(404, "Timer not found");
}

export async function listTimers(req, res) {
  const timers = await timersService.listTimers(getSessionShop(res));
  const now = new Date();
  res.status(200).json({
    timers: timers.map((timer) => toTimerResponse(timer, now)),
  });
}

export async function getTimer(req, res) {
  const timer = await timersService.getTimer(getSessionShop(res), req.params.id);
  if (!timer) {
    throw timerNotFound();
  }
  res.status(200).json({ timer: toTimerResponse(timer) });
}

export async function createTimer(req, res) {
  const timer = await timersService.createTimer(
    getSessionShop(res),
    req.validatedBody
  );
  res.status(201).json({ timer: toTimerResponse(timer) });
}

export async function updateTimer(req, res) {
  const timer = await timersService.updateTimer(
    getSessionShop(res),
    req.params.id,
    req.validatedBody
  );
  if (!timer) {
    throw timerNotFound();
  }
  res.status(200).json({ timer: toTimerResponse(timer) });
}

export async function deleteTimer(req, res) {
  const wasDeleted = await timersService.deleteTimer(
    getSessionShop(res),
    req.params.id
  );
  if (!wasDeleted) {
    throw timerNotFound();
  }
  res.status(204).end();
}
