import { getEvergreenRemaining } from "../../web/lib/timerLogic.js";

function storageKey(timerId) {
  return `countdown-timer:evergreen:${timerId}`;
}

function readFirstSeenAt(timerId) {
  try {
    return localStorage.getItem(storageKey(timerId));
  } catch {
    return null;
  }
}

function saveFirstSeenAt(timerId, startedAt) {
  try {
    localStorage.setItem(storageKey(timerId), String(startedAt));
  } catch {
    return;
  }
}

export function getEvergreenEndTime(
  timerId,
  durationMinutes,
  now = Date.now(),
) {
  const { startedAt, endsAt, hasReset } = getEvergreenRemaining(
    readFirstSeenAt(timerId),
    durationMinutes,
    now,
  );
  if (hasReset) {
    saveFirstSeenAt(timerId, startedAt);
  }
  return endsAt;
}
