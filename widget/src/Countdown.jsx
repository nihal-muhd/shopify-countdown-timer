import { useEffect, useRef, useState } from "preact/hooks";
import { getEvergreenEndTime } from "./evergreen.js";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function resolveEndTime(timer, now) {
  if (timer.type === "evergreen") {
    return getEvergreenEndTime(timer.id, timer.durationMinutes, now);
  }
  return new Date(timer.endAt).getTime();
}

function padTwoDigits(value) {
  return String(value).padStart(2, "0");
}

function toTimeUnits(remainingMs) {
  const totalSeconds = Math.floor(remainingMs / SECOND_MS);
  const days = Math.floor(remainingMs / DAY_MS);
  const units = [
    { label: "Hrs", value: Math.floor(totalSeconds / 3600) % 24 },
    { label: "Mins", value: Math.floor(totalSeconds / 60) % 60 },
    { label: "Secs", value: totalSeconds % 60 },
  ];
  return days > 0 ? [{ label: "Days", value: days }, ...units] : units;
}

function isUrgent(remainingMs, urgencyMinutes) {
  return urgencyMinutes > 0 && remainingMs <= urgencyMinutes * MINUTE_MS;
}

export function Countdown({ timer, onFinished }) {
  const endTimeRef = useRef(resolveEndTime(timer, Date.now()));
  const [remainingMs, setRemainingMs] = useState(
    () => endTimeRef.current - Date.now()
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      try {
        const now = Date.now();
        if (timer.type === "evergreen" && now >= endTimeRef.current) {
          endTimeRef.current = resolveEndTime(timer, now);
        }
        setRemainingMs(endTimeRef.current - now);
      } catch {
        clearInterval(intervalId);
        onFinished();
      }
    }, SECOND_MS);
    return () => clearInterval(intervalId);
  }, [timer, onFinished]);

  useEffect(() => {
    if (remainingMs <= 0 && timer.type === "fixed") {
      onFinished();
    }
  }, [remainingMs, timer.type, onFinished]);

  if (remainingMs <= 0) {
    return null;
  }

  const { headline, position, bgColor, textColor, urgencyMinutes } = timer.style;
  const headlineElement = <p class="countdown-timer__headline">{headline}</p>;
  const className = isUrgent(remainingMs, urgencyMinutes)
    ? "countdown-timer countdown-timer--urgent"
    : "countdown-timer";

  return (
    <div
      class={className}
      role="timer"
      aria-label={headline}
      style={{ "--countdown-bg": bgColor, "--countdown-text": textColor }}
    >
      {position === "bottom" ? null : headlineElement}
      <div class="countdown-timer__digits">
        {toTimeUnits(remainingMs).map((unit) => (
          <span class="countdown-timer__unit" key={unit.label}>
            <span class="countdown-timer__value">{padTwoDigits(unit.value)}</span>
            <span class="countdown-timer__label">{unit.label}</span>
          </span>
        ))}
      </div>
      {position === "bottom" ? headlineElement : null}
    </div>
  );
}
