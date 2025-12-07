import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const FailedMessagesWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="Failed Messages"
        value="3"
        description="Last 24 hours"
        color="error"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default FailedMessagesWidget;
