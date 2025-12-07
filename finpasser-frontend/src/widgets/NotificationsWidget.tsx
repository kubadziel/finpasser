import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const NotificationsWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="Notifications"
        value="5"
        description="Pending acknowledgements"
        color="secondary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default NotificationsWidget;
