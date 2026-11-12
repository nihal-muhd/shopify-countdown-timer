import { useNavigate, useParams } from "react-router-dom";
import { Banner, Card, Layout, Page, SkeletonBodyText } from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { TimerForm } from "../../components";
import { useSaveTimer, useTimer } from "../../utils/timersApi";

export default function EditTimerPage() {
  const { id: timerId } = useParams();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const { data: timer, isLoading, error } = useTimer(timerId);
  const saveTimer = useSaveTimer(timerId);
  const goToDashboard = () => navigate("/");

  async function updateTimer(requestBody) {
    await saveTimer.mutateAsync(requestBody);
    shopify.toast.show("Timer saved");
    goToDashboard();
  }

  function renderContent() {
    if (isLoading) {
      return (
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <SkeletonBodyText lines={10} />
            </Card>
          </Layout.Section>
        </Layout>
      );
    }

    if (error) {
      const isMissing = error.status === 404;
      return (
        <Banner
          title={isMissing ? "Timer not found" : "Timer could not be loaded"}
          status={isMissing ? "warning" : "critical"}
          action={{ content: "Back to timers", onAction: goToDashboard }}
        >
          <p>
            {isMissing
              ? "It may have been deleted."
              : "Check your connection and try again."}
          </p>
        </Banner>
      );
    }

    return (
      <TimerForm
        key={timer.id}
        timer={timer}
        submitLabel="Save"
        isSaving={saveTimer.isLoading}
        onSubmit={updateTimer}
        onCancel={goToDashboard}
      />
    );
  }

  return (
    <Page>
      <TitleBar title={timer?.title ?? "Edit timer"}>
        <button variant="breadcrumb" onClick={goToDashboard}>
          Timers
        </button>
      </TitleBar>
      {renderContent()}
    </Page>
  );
}
