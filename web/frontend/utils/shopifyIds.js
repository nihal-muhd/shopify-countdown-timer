export const RESOURCE_TYPES = Object.freeze({
  product: "Product",
  collection: "Collection",
});

export function toNumericId(gidOrNumericId) {
  return String(gidOrNumericId).split("/").pop();
}

export function toGid(resourceType, numericId) {
  return `gid://shopify/${resourceType}/${toNumericId(numericId)}`;
}
