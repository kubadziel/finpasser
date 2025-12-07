import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const ProcessedTodayWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="Processed Today"
        value="34"
        description="Successfully routed"
        color="secondary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default ProcessedTodayWidget;
