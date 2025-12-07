import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const StorageUsageWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="Storage Usage"
        value="72%"
        description="MinIO bucket"
        color="secondary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default StorageUsageWidget;
