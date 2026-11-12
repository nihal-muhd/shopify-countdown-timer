import mongoose from "mongoose";

export const TIMER_TYPES = ["fixed", "evergreen"];
export const TARGET_TYPES = ["all", "products", "collections"];
export const TIMER_POSITIONS = ["top", "bottom"];

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const NUMERIC_ID_PATTERN = /^\d+$/;

function isFixedTimer() {
  return this.type === "fixed";
}

function isEvergreenTimer() {
  return this.type === "evergreen";
}

function endsAfterStart(endAt) {
  if (!this.startAt || !endAt) {
    return true;
  }
  return endAt > this.startAt;
}

const styleSchema = new mongoose.Schema(
  {
    bgColor: { type: String, match: HEX_COLOR_PATTERN, default: "#111827" },
    textColor: { type: String, match: HEX_COLOR_PATTERN, default: "#FFFFFF" },
    position: { type: String, enum: TIMER_POSITIONS, default: "top" },
    headline: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "Hurry! Sale ends in",
    },
    urgencyMinutes: { type: Number, min: 0, default: 60 },
  },
  { _id: false },
);

const timerSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: TIMER_TYPES, required: true },
    startAt: { type: Date, required: isFixedTimer },
    endAt: {
      type: Date,
      required: isFixedTimer,
      validate: {
        validator: endsAfterStart,
        message: "endAt must be after startAt",
      },
    },
    durationMinutes: { type: Number, min: 1, required: isEvergreenTimer },
    targetType: { type: String, enum: TARGET_TYPES, required: true },
    productIds: {
      type: [{ type: String, match: NUMERIC_ID_PATTERN }],
      default: [],
    },
    collectionIds: {
      type: [{ type: String, match: NUMERIC_ID_PATTERN }],
      default: [],
    },
    style: { type: styleSchema, default: () => ({}) },
    isEnabled: { type: Boolean, default: true },
    impressions: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

timerSchema.index({ shop: 1, isEnabled: 1 });

export const Timer = mongoose.model("Timer", timerSchema);
