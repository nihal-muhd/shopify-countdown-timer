import { useNavigate } from "react-router-dom";
import { Page } from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { TimerForm } from "../../components";
import { useSaveTimer } from "../../utils/timersApi";

export default function NewTimerPage() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const saveTimer = useSaveTimer();

  async function createTimer(requestBody) {
    await saveTimer.mutateAsync(requestBody);
    shopify.toast.show("Timer created");
    navigate("/");
  }

  return (
    <Page>
      <TitleBar title="Create timer">
        <button variant="breadcrumb" onClick={() => navigate("/")}>
          Timers
        </button>
      </TitleBar>
      <TimerForm
        submitLabel="Create timer"
        isSaving={saveTimer.isLoading}
        onSubmit={createTimer}
        onCancel={() => navigate("/")}
      />
    </Page>
  );
}
