import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banner,
  Card,
  EmptyState,
  Layout,
  Modal,
  Page,
  SkeletonBodyText,
  Text,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { TimerTable } from "../components";
import { useDeleteTimer, useTimers } from "../utils/timersApi";

const EMPTY_STATE_IMAGE =
  "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png";

export default function TimersDashboard() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const { data: timers = [], isLoading, isError, refetch } = useTimers();
  const deleteTimer = useDeleteTimer();
  const [timerToDelete, setTimerToDelete] = useState(null);

  const goToCreatePage = () => navigate("/timers/new");
  const goToEditPage = (timerId) => navigate(`/timers/${timerId}`);
  const closeDeleteModal = () => setTimerToDelete(null);

  async function confirmDelete() {
    try {
      await deleteTimer.mutateAsync(timerToDelete.id);
      shopify.toast.show("Timer deleted");
    } catch (error) {
      shopify.toast.show(error.message, { isError: true });
    } finally {
      closeDeleteModal();
    }
  }

  function renderTimers() {
    if (isLoading) {
      return (
        <Card sectioned>
          <SkeletonBodyText lines={6} />
        </Card>
      );
    }

    if (timers.length === 0) {
      return (
        <Card sectioned>
          <EmptyState
            heading="Create your first countdown timer"
            action={{ content: "Create timer", onAction: goToCreatePage }}
            image={EMPTY_STATE_IMAGE}
          >
            <p>
              Add urgency to your promotions with a fixed sale countdown or an
              evergreen timer that starts for each visitor.
            </p>
          </EmptyState>
        </Card>
      );
    }

    return (
      <Card>
        <TimerTable
          timers={timers}
          onEdit={goToEditPage}
          onDelete={setTimerToDelete}
        />
      </Card>
    );
  }

  return (
    <Page fullWidth>
      <TitleBar title="Countdown timers">
        <button variant="primary" onClick={goToCreatePage}>
          Create timer
        </button>
      </TitleBar>

      <Layout>
        {isError ? (
          <Layout.Section>
            <Banner
              title="Timers could not be loaded"
              status="critical"
              action={{ content: "Try again", onAction: refetch }}
            />
          </Layout.Section>
        ) : null}
        <Layout.Section>{renderTimers()}</Layout.Section>
      </Layout>

      <Modal
        open={Boolean(timerToDelete)}
        title="Delete timer?"
        onClose={closeDeleteModal}
        primaryAction={{
          content: "Delete",
          destructive: true,
          loading: deleteTimer.isLoading,
          onAction: confirmDelete,
        }}
        secondaryActions={[{ content: "Cancel", onAction: closeDeleteModal }]}
      >
        <Modal.Section>
          <Text as="p">
            “{timerToDelete?.title}” will stop showing on your storefront. This
            can’t be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
