import type { WidgetDefinition } from "../components/widgetTypes";
import AlertsWidget from "./AlertsWidget";
import AvgLatencyWidget from "./AvgLatencyWidget";
import DailyThroughputWidget from "./DailyThroughputWidget";
import FailedMessagesWidget from "./FailedMessagesWidget";
import KafkaLagWidget from "./KafkaLagWidget";
import NotificationsWidget from "./NotificationsWidget";
import PendingMessagesWidget from "./PendingMessagesWidget";
import ProcessedTodayWidget from "./ProcessedTodayWidget";
import SLAComplianceWidget from "./SLAComplianceWidget";
import StorageUsageWidget from "./StorageUsageWidget";
import UploadXmlWidget from "./UploadXmlWidget";

export const widgetDefinitions: WidgetDefinition[] = [
    { id: "pending", component: PendingMessagesWidget },
    { id: "processed", component: ProcessedTodayWidget },
    { id: "alerts", component: AlertsWidget },
    { id: "throughput", component: DailyThroughputWidget },
    { id: "latency", component: AvgLatencyWidget },
    { id: "failures", component: FailedMessagesWidget },
    { id: "kafka", component: KafkaLagWidget },
    { id: "storage", component: StorageUsageWidget },
    { id: "sla", component: SLAComplianceWidget },
    { id: "notifications", component: NotificationsWidget },
    { id: "uploader", component: UploadXmlWidget, rowSpan: 2, colSpan: 1 },
];

export const widgetDefinitionMap = new Map(
    widgetDefinitions.map((definition) => [definition.id, definition])
);
