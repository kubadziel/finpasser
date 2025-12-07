import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const DailyThroughputWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="Daily Throughput"
        value="128"
        description="Files processed in 24h"
        color="primary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default DailyThroughputWidget;
