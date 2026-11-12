import {
  Button,
  ChoiceList,
  InlineError,
  Stack,
  Tag,
  Text,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { RESOURCE_TYPES, toGid, toNumericId } from "../utils/shopifyIds";

const TARGET_CHOICES = [
  { label: "All products", value: "all" },
  { label: "Specific products", value: "products" },
  { label: "Specific collections", value: "collections" },
];

const PICKER_SETTINGS = {
  products: {
    pickerType: "product",
    resourceType: RESOURCE_TYPES.product,
    noun: "product",
    extraOptions: { filter: { variants: false } },
  },
  collections: {
    pickerType: "collection",
    resourceType: RESOURCE_TYPES.collection,
    noun: "collection",
    extraOptions: {},
  },
};

function describeSelection(count, noun) {
  if (count === 0) {
    return `No ${noun}s selected`;
  }
  return `${count} ${noun}${count === 1 ? "" : "s"} selected`;
}

export function TargetPicker({
  targetType,
  selectedItems,
  error,
  onTargetTypeChange,
  onSelectedItemsChange,
}) {
  const shopify = useAppBridge();
  const pickerSettings = PICKER_SETTINGS[targetType];

  async function openResourcePicker() {
    const selection = await shopify.resourcePicker({
      type: pickerSettings.pickerType,
      action: "select",
      multiple: true,
      selectionIds: selectedItems.map((item) => ({
        id: toGid(pickerSettings.resourceType, item.id),
      })),
      ...pickerSettings.extraOptions,
    });

    if (!selection) {
      return;
    }

    onSelectedItemsChange(
      selection.map((resource) => ({
        id: toNumericId(resource.id),
        title: resource.title,
      })),
    );
  }

  function removeItem(itemId) {
    onSelectedItemsChange(selectedItems.filter((item) => item.id !== itemId));
  }

  return (
    <Stack vertical spacing="loose">
      <ChoiceList
        title="Show this timer on"
        choices={TARGET_CHOICES}
        selected={[targetType]}
        onChange={([nextTargetType]) => onTargetTypeChange(nextTargetType)}
      />

      {pickerSettings ? (
        <Stack vertical spacing="tight">
          <Stack alignment="center" distribution="equalSpacing">
            <Text as="span" color="subdued">
              {describeSelection(selectedItems.length, pickerSettings.noun)}
            </Text>
            <Button onClick={openResourcePicker}>
              {selectedItems.length === 0
                ? `Select ${pickerSettings.noun}s`
                : `Change ${pickerSettings.noun}s`}
            </Button>
          </Stack>

          {selectedItems.length > 0 ? (
            <Stack spacing="tight">
              {selectedItems.map((item) => (
                <Tag key={item.id} onRemove={() => removeItem(item.id)}>
                  {item.title || `${pickerSettings.noun} #${item.id}`}
                </Tag>
              ))}
            </Stack>
          ) : null}

          {error ? <InlineError message={error} fieldID="targetItems" /> : null}
        </Stack>
      ) : null}
    </Stack>
  );
}
