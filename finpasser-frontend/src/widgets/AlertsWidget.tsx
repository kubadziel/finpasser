import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const AlertsWidget: React.FC<WidgetContentProps> = ({ isEditMode, cardProps }) => (
    <WidgetCard
        title="Alerts"
        value="2"
        description="Requires review"
        color="error"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default AlertsWidget;
