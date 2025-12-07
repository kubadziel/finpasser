import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const PendingMessagesWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="Pending Messages"
        value="12"
        description="Awaiting processing"
        color="primary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default PendingMessagesWidget;
