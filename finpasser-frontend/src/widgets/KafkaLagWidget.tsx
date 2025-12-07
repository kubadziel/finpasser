import React from "react";
import WidgetCard from "../components/WidgetCard";
import type { WidgetContentProps } from "../components/widgetTypes";

const KafkaLagWidget: React.FC<WidgetContentProps> = ({ isEditMode, cardProps }) => (
    <WidgetCard
        title="Kafka Lag"
        value="12"
        description="Messages waiting"
        color="primary"
        isEditMode={isEditMode}
        cardProps={cardProps}
    />
);

export default KafkaLagWidget;
