import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const SLAComplianceWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard
        title="SLA Compliance"
        value="99.4%"
        description="Past 7 days"
        color="primary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default SLAComplianceWidget;
