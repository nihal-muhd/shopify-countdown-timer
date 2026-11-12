import { Badge, Button, ButtonGroup, IndexTable, Text } from "@shopify/polaris";

const STATUS_BADGES = {
  active: { status: "success", label: "Active" },
  scheduled: { status: "info", label: "Scheduled" },
  expired: { status: "critical", label: "Expired" },
  disabled: { status: undefined, label: "Disabled" },
};

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function describeTarget(timer) {
  if (timer.targetType === "products") {
    const count = timer.productIds.length;
    return `${count} product${count === 1 ? "" : "s"}`;
  }
  if (timer.targetType === "collections") {
    const count = timer.collectionIds.length;
    return `${count} collection${count === 1 ? "" : "s"}`;
  }
  return "All products";
}

function describeSchedule(timer) {
  if (timer.type === "evergreen") {
    return `${timer.durationMinutes} min per visitor`;
  }
  const startsAt = DATE_TIME_FORMAT.format(new Date(timer.startAt));
  const endsAt = DATE_TIME_FORMAT.format(new Date(timer.endAt));
  return `${startsAt} – ${endsAt}`;
}

function StatusBadge({ status }) {
  const badge = STATUS_BADGES[status] ?? STATUS_BADGES.disabled;
  return <Badge status={badge.status}>{badge.label}</Badge>;
}

export function TimerTable({ timers, onEdit, onDelete }) {
  const rows = timers.map((timer, index) => (
    <IndexTable.Row id={timer.id} key={timer.id} position={index}>
      <IndexTable.Cell>
        <Button plain monochrome onClick={() => onEdit(timer.id)}>
          <Text as="span" fontWeight="semibold">
            {timer.title}
          </Text>
        </Button>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {timer.type === "fixed" ? "Fixed" : "Evergreen"}
      </IndexTable.Cell>
      <IndexTable.Cell>{describeSchedule(timer)}</IndexTable.Cell>
      <IndexTable.Cell>{describeTarget(timer)}</IndexTable.Cell>
      <IndexTable.Cell>
        <StatusBadge status={timer.status} />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {timer.impressions.toLocaleString()}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <ButtonGroup>
          <Button size="slim" onClick={() => onEdit(timer.id)}>
            Edit
          </Button>
          <Button
            size="slim"
            destructive
            outline
            onClick={() => onDelete(timer)}
          >
            Delete
          </Button>
        </ButtonGroup>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <IndexTable
      resourceName={{ singular: "timer", plural: "timers" }}
      itemCount={timers.length}
      selectable={false}
      headings={[
        { title: "Title" },
        { title: "Type" },
        { title: "Schedule" },
        { title: "Shown on" },
        { title: "Status" },
        { title: "Impressions", alignment: "end" },
        { title: "Actions" },
      ]}
    >
      {rows}
    </IndexTable>
  );
}
