import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const AvgLatencyWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="Avg Latency"
        value="820ms"
        description="Upload to ack"
        color="secondary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default AvgLatencyWidget;
