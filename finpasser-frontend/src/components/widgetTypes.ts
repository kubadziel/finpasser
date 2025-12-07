export type WidgetSize = number;

export type Widget = {
    id: string;
    title: string;
    value?: string;
    description?: string;
    color?: "primary" | "error" | "secondary";
    size?: WidgetSize;
    rowSpan?: number;
    colSpan?: number;
    type?: "upload";
};
