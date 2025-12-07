import type { FC } from "react";
import type { CardProps } from "@mui/material";

export type Widget = {
    id: string;
    rowSpan?: number;
    colSpan?: number;
};

export type WidgetContentProps = {
    isEditMode: boolean;
    cardProps?: CardProps;
};

export type WidgetDefinition = Widget & {
    component: FC<WidgetContentProps>;
};
