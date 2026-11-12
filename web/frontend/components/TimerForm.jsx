import { useState } from "react";
import {
  Card,
  Checkbox,
  ChoiceList,
  FormLayout,
  Layout,
  PageActions,
  Select,
  Stack,
  Text,
  TextField,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { TargetPicker } from "./TargetPicker";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LIMITS = { title: 100, headline: 80, maxDurationMinutes: 43200, maxUrgencyMinutes: 10080 };

const TYPE_CHOICES = [
  {
    label: "Fixed",
    value: "fixed",
    helpText: "Same start and end date for every visitor, e.g. a weekend sale.",
  },
  {
    label: "Evergreen",
    value: "evergreen",
    helpText: "Starts when a visitor first sees it and restarts after it ends.",
  },
];

const POSITION_OPTIONS = [
  { label: "Above the product details", value: "top" },
  { label: "Below the product details", value: "bottom" },
];

function padTwoDigits(value) {
  return String(value).padStart(2, "0");
}

function toDateTimeLocalValue(value) {
  const date = new Date(value);
  return [
    `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`,
    `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`,
  ].join("T");
}

function toFormValues(timer) {
  const now = Date.now();
  return {
    title: timer?.title ?? "",
    isEnabled: timer?.isEnabled ?? true,
    type: timer?.type ?? "fixed",
    startAt: toDateTimeLocalValue(timer?.startAt ?? now),
    endAt: toDateTimeLocalValue(timer?.endAt ?? now + ONE_WEEK_MS),
    durationMinutes: String(timer?.durationMinutes ?? 30),
    targetType: timer?.targetType ?? "all",
    products: (timer?.productIds ?? []).map((id) => ({ id })),
    collections: (timer?.collectionIds ?? []).map((id) => ({ id })),
    bgColor: timer?.style?.bgColor ?? "#111827",
    textColor: timer?.style?.textColor ?? "#FFFFFF",
    position: timer?.style?.position ?? "top",
    headline: timer?.style?.headline ?? "Hurry! Sale ends in",
    urgencyMinutes: String(timer?.style?.urgencyMinutes ?? 60),
  };
}

function isWholeNumberInRange(value, min, max) {
  const number = Number(value);
  return value.trim() !== "" && Number.isInteger(number) && number >= min && number <= max;
}

function validate(values) {
  const errors = {};
  const title = values.title.trim();
  const headline = values.headline.trim();

  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > LIMITS.title) {
    errors.title = `Title must be at most ${LIMITS.title} characters`;
  }

  if (values.type === "fixed") {
    const startTime = new Date(values.startAt).getTime();
    const endTime = new Date(values.endAt).getTime();
    if (Number.isNaN(startTime)) {
      errors.startAt = "Pick a start date and time";
    }
    if (Number.isNaN(endTime)) {
      errors.endAt = "Pick an end date and time";
    } else if (endTime <= startTime) {
      errors.endAt = "End date must be after start date";
    }
  } else if (!isWholeNumberInRange(values.durationMinutes, 1, LIMITS.maxDurationMinutes)) {
    errors.durationMinutes = `Enter whole minutes between 1 and ${LIMITS.maxDurationMinutes}`;
  }

  if (values.targetType === "products" && values.products.length === 0) {
    errors.productIds = "Pick at least one product";
  }
  if (values.targetType === "collections" && values.collections.length === 0) {
    errors.collectionIds = "Pick at least one collection";
  }

  if (!HEX_COLOR_PATTERN.test(values.bgColor)) {
    errors["style.bgColor"] = "Use a hex color like #111827";
  }
  if (!HEX_COLOR_PATTERN.test(values.textColor)) {
    errors["style.textColor"] = "Use a hex color like #FFFFFF";
  }
  if (!headline) {
    errors["style.headline"] = "Headline is required";
  } else if (headline.length > LIMITS.headline) {
    errors["style.headline"] = `Headline must be at most ${LIMITS.headline} characters`;
  }
  if (!isWholeNumberInRange(values.urgencyMinutes, 0, LIMITS.maxUrgencyMinutes)) {
    errors["style.urgencyMinutes"] = `Enter whole minutes between 0 and ${LIMITS.maxUrgencyMinutes}`;
  }

  return errors;
}

function toRequestBody(values) {
  const sharedFields = {
    title: values.title.trim(),
    isEnabled: values.isEnabled,
    targetType: values.targetType,
    productIds: values.targetType === "products" ? values.products.map((item) => item.id) : [],
    collectionIds:
      values.targetType === "collections" ? values.collections.map((item) => item.id) : [],
    style: {
      bgColor: values.bgColor,
      textColor: values.textColor,
      position: values.position,
      headline: values.headline.trim(),
      urgencyMinutes: Number(values.urgencyMinutes),
    },
  };

  if (values.type === "fixed") {
    return {
      ...sharedFields,
      type: "fixed",
      startAt: new Date(values.startAt).toISOString(),
      endAt: new Date(values.endAt).toISOString(),
    };
  }
  return { ...sharedFields, type: "evergreen", durationMinutes: Number(values.durationMinutes) };
}

function toFieldErrors(details = []) {
  return Object.fromEntries(details.map((detail) => [detail.field, detail.message]));
}

function ColorField({ label, value, error, onChange }) {
  const swatchValue = HEX_COLOR_PATTERN.test(value) ? value : "#000000";
  return (
    <TextField
      label={label}
      value={value}
      error={error}
      autoComplete="off"
      maxLength={7}
      onChange={onChange}
      connectedRight={
        <input
          type="color"
          aria-label={`${label} picker`}
          value={swatchValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          style={{ width: 44, height: 36, padding: 2, border: "none", background: "none" }}
        />
      }
    />
  );
}

function TimerPreview({ values }) {
  const isEvergreen = values.type === "evergreen";
  return (
    <div
      style={{
        background: HEX_COLOR_PATTERN.test(values.bgColor) ? values.bgColor : "#111827",
        color: HEX_COLOR_PATTERN.test(values.textColor) ? values.textColor : "#FFFFFF",
        borderRadius: 8,
        padding: "12px 16px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 14 }}>{values.headline.trim() || "Headline"}</div>
      <div style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {isEvergreen ? "00 : 29 : 59" : "02 : 14 : 37 : 59"}
      </div>
    </div>
  );
}

export function TimerForm({ timer, submitLabel, isSaving, onSubmit, onCancel }) {
  const shopify = useAppBridge();
  const [values, setValues] = useState(() => toFormValues(timer));
  const [errors, setErrors] = useState({});

  function updateField(field) {
    return (nextValue) => {
      setValues((current) => ({ ...current, [field]: nextValue }));
      setErrors((current) => ({ ...current, [field]: undefined, [`style.${field}`]: undefined }));
    };
  }

  function updateTargetType(nextTargetType) {
    setValues((current) => ({ ...current, targetType: nextTargetType }));
    setErrors((current) => ({ ...current, productIds: undefined, collectionIds: undefined }));
  }

  function updateSelectedItems(nextItems) {
    const listField = values.targetType === "products" ? "products" : "collections";
    setValues((current) => ({ ...current, [listField]: nextItems }));
    setErrors((current) => ({ ...current, productIds: undefined, collectionIds: undefined }));
  }

  async function handleSubmit() {
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      shopify.toast.show("Please fix the highlighted fields", { isError: true });
      return;
    }

    try {
      await onSubmit(toRequestBody(values));
    } catch (error) {
      setErrors(toFieldErrors(error.details));
      shopify.toast.show(error.message, { isError: true });
    }
  }

  const selectedItems = values.targetType === "collections" ? values.collections : values.products;
  const targetError = errors.productIds || errors.collectionIds;

  return (
    <Layout>
      <Layout.Section>
        <Card title="Timer details" sectioned>
          <FormLayout>
            <TextField
              label="Title"
              helpText="Only you see this, in the timers list."
              value={values.title}
              error={errors.title}
              autoComplete="off"
              maxLength={LIMITS.title}
              showCharacterCount
              onChange={updateField("title")}
            />
            <Checkbox
              label="Show this timer on the storefront"
              checked={values.isEnabled}
              onChange={updateField("isEnabled")}
            />
          </FormLayout>
        </Card>

        <Card title="Schedule" sectioned>
          <FormLayout>
            <ChoiceList
              title="Timer type"
              choices={TYPE_CHOICES}
              selected={[values.type]}
              onChange={([nextType]) => updateField("type")(nextType)}
            />
            {values.type === "fixed" ? (
              <FormLayout.Group>
                <TextField
                  label="Starts"
                  type="datetime-local"
                  value={values.startAt}
                  error={errors.startAt}
                  autoComplete="off"
                  onChange={updateField("startAt")}
                />
                <TextField
                  label="Ends"
                  type="datetime-local"
                  value={values.endAt}
                  error={errors.endAt}
                  autoComplete="off"
                  onChange={updateField("endAt")}
                />
              </FormLayout.Group>
            ) : (
              <TextField
                label="Duration per visitor"
                type="number"
                suffix="minutes"
                min={1}
                value={values.durationMinutes}
                error={errors.durationMinutes}
                autoComplete="off"
                onChange={updateField("durationMinutes")}
              />
            )}
          </FormLayout>
        </Card>

        <Card title="Products" sectioned>
          <TargetPicker
            targetType={values.targetType}
            selectedItems={selectedItems}
            error={targetError}
            onTargetTypeChange={updateTargetType}
            onSelectedItemsChange={updateSelectedItems}
          />
        </Card>

        <Card title="Appearance" sectioned>
          <FormLayout>
            <TextField
              label="Headline"
              value={values.headline}
              error={errors["style.headline"]}
              autoComplete="off"
              maxLength={LIMITS.headline}
              showCharacterCount
              onChange={updateField("headline")}
            />
            <FormLayout.Group>
              <ColorField
                label="Background color"
                value={values.bgColor}
                error={errors["style.bgColor"]}
                onChange={updateField("bgColor")}
              />
              <ColorField
                label="Text color"
                value={values.textColor}
                error={errors["style.textColor"]}
                onChange={updateField("textColor")}
              />
            </FormLayout.Group>
            <FormLayout.Group>
              <Select
                label="Position"
                options={POSITION_OPTIONS}
                value={values.position}
                onChange={updateField("position")}
              />
              <TextField
                label="Urgency starts"
                helpText="The timer changes style when this little time is left."
                type="number"
                suffix="minutes left"
                min={0}
                value={values.urgencyMinutes}
                error={errors["style.urgencyMinutes"]}
                autoComplete="off"
                onChange={updateField("urgencyMinutes")}
              />
            </FormLayout.Group>
          </FormLayout>
        </Card>
      </Layout.Section>

      <Layout.Section secondary>
        <Card title="Preview" sectioned>
          <Stack vertical spacing="tight">
            <TimerPreview values={values} />
            <Text as="p" color="subdued">
              How the countdown looks on a product page.
            </Text>
          </Stack>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <PageActions
          primaryAction={{ content: submitLabel, loading: isSaving, onAction: handleSubmit }}
          secondaryActions={[{ content: "Cancel", disabled: isSaving, onAction: onCancel }]}
        />
      </Layout.Section>
    </Layout>
  );
}
