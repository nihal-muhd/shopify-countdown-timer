import { render } from "preact";
import { Countdown } from "./Countdown.jsx";
import { fetchTimer, sendImpressionOnce } from "./api.js";
import styles from "./styles.css";

const ROOT_SELECTOR = "[data-countdown-timer]";
const MOUNTED_ATTRIBUTE = "data-countdown-mounted";
const STYLE_ELEMENT_ID = "countdown-timer-styles";
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function injectStylesOnce() {
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

function collapse(root) {
  render(null, root);
  root.style.display = "none";
}

function isDisplayableTimer(timer) {
  if (!timer || typeof timer.id !== "string" || !timer.style) {
    return false;
  }
  const { bgColor, textColor } = timer.style;
  if (!HEX_COLOR_PATTERN.test(bgColor) || !HEX_COLOR_PATTERN.test(textColor)) {
    return false;
  }
  if (timer.type === "fixed") {
    return new Date(timer.endAt).getTime() > Date.now();
  }
  return timer.type === "evergreen" && timer.durationMinutes > 0;
}

async function mountCountdown(root) {
  if (root.hasAttribute(MOUNTED_ATTRIBUTE)) {
    return;
  }
  root.setAttribute(MOUNTED_ATTRIBUTE, "");

  try {
    const { proxyBase, productId, collectionIds } = root.dataset;
    const timer = await fetchTimer({ proxyBase, productId, collectionIds });
    if (!isDisplayableTimer(timer)) {
      collapse(root);
      return;
    }

    injectStylesOnce();
    render(<Countdown timer={timer} onFinished={() => collapse(root)} />, root);
    sendImpressionOnce(proxyBase, timer.id);
  } catch {
    collapse(root);
  }
}

function mountAll() {
  try {
    document.querySelectorAll(ROOT_SELECTOR).forEach(mountCountdown);
  } catch {
    return;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAll);
} else {
  mountAll();
}
