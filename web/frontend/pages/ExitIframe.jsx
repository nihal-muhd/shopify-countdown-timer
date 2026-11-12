import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Banner, Layout, Page } from "@shopify/polaris";

function toAllowedRedirectUrl(search) {
  const redirectUri = new URLSearchParams(search).get("redirectUri");
  if (!redirectUri) {
    return null;
  }
  const url = new URL(decodeURIComponent(redirectUri));
  const isShopifyOrThisApp =
    [window.location.hostname, "admin.shopify.com"].includes(url.hostname) ||
    url.hostname.endsWith(".myshopify.com");
  return isShopifyOrThisApp ? url.toString() : null;
}

export default function ExitIframe() {
  const shopify = useAppBridge();
  const { search } = useLocation();
  const allowedRedirectUrl = search ? toAllowedRedirectUrl(search) : null;
  const showWarning = Boolean(search) && !allowedRedirectUrl;

  useEffect(() => {
    shopify.loading(true);
    if (allowedRedirectUrl) {
      window.open(allowedRedirectUrl, "_top");
    }
  }, [shopify, allowedRedirectUrl]);

  return showWarning ? (
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <div style={{ marginTop: "100px" }}>
            <Banner title="Redirecting outside of Shopify" status="warning">
              Apps can only use /exitiframe to reach Shopify or the app itself.
            </Banner>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  ) : null;
}
