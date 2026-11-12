import { DeliveryMethod } from "@shopify/shopify-api";

async function acknowledgeWithoutStoredCustomerData() {}

function mandatoryPrivacyWebhook() {
  return {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: acknowledgeWithoutStoredCustomerData,
  };
}

export default {
  CUSTOMERS_DATA_REQUEST: mandatoryPrivacyWebhook(),
  CUSTOMERS_REDACT: mandatoryPrivacyWebhook(),
  SHOP_REDACT: mandatoryPrivacyWebhook(),
};
