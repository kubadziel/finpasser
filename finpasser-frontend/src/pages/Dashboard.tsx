import React, { useEffect, useState } from "react";
import { Typography, Container, Stack, Button, Box } from "@mui/material";
import {
    DndContext,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WidgetCard from "../components/WidgetCard";
import { Widget } from "../components/widgetTypes";

const LAYOUT_STORAGE_KEY = "finpasser-dashboard-layout";
const STORAGE_MODE = "session" as "session" | "backend"; // backend mode planned for future

const defaultWidgets: Widget[] = [
    {
        id: "pending",
        title: "Pending Messages",
        value: "12",
        description: "Awaiting processing",
        color: "primary",
    },
    {
        id: "processed",
        title: "Processed Today",
        value: "34",
        description: "Successfully routed",
        color: "secondary",
    },
    {
        id: "alerts",
        title: "Alerts",
        value: "2",
        description: "Requires review",
        color: "error",
    },
    {
        id: "throughput",
        title: "Daily Throughput",
        value: "128",
        description: "Files processed in 24h",
        color: "primary",
    },
    {
        id: "latency",
        title: "Avg Latency",
        value: "820ms",
        description: "Upload to ack",
        color: "secondary",
    },
    {
        id: "failures",
        title: "Failed Messages",
        value: "3",
        description: "Last 24 hours",
        color: "error",
    },
    {
        id: "kafka",
        title: "Kafka Lag",
        value: "12",
        description: "Messages waiting",
        color: "primary",
    },
    {
        id: "storage",
        title: "Storage Usage",
        value: "72%",
        description: "MinIO bucket",
        color: "secondary",
    },
    {
        id: "sla",
        title: "SLA Compliance",
        value: "99.4%",
        description: "Past 7 days",
        color: "primary",
    },
    {
        id: "notifications",
        title: "Notifications",
        value: "5",
        description: "Pending acknowledgements",
        color: "secondary",
    },
    {
        id: "uploader",
        title: "Upload XML Message",
        description: "",
        rowSpan: 2,
        colSpan: 1,
        type: "upload",
    },
];

const mergeWithDefaults = (layout: Widget[]): Widget[] => {
    const defaultsById = new Map(defaultWidgets.map((w) => [w.id, w]));

    const orderedLayout = layout.map((storedWidget) => {
        const defaultWidget = defaultsById.get(storedWidget.id);
        if (!defaultWidget) {
            return storedWidget;
        }
        return {
            ...storedWidget,
            rowSpan: defaultWidget.rowSpan ?? storedWidget.rowSpan,
            colSpan: defaultWidget.colSpan ?? storedWidget.colSpan,
        };
    });

    const missingDefaults = defaultWidgets.filter(
        (widget) => !layout.some((stored) => stored.id === widget.id)
    );

    return [...orderedLayout, ...missingDefaults];
};

const loadLayout = async (): Promise<Widget[] | null> => {
    if (STORAGE_MODE === "backend") {
        // TODO: integrate API call once backend persistence is available
        return null;
    }
    if (typeof window === "undefined") {
        return null;
    }
    try {
        const raw = sessionStorage.getItem(LAYOUT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return mergeWithDefaults(parsed);
        }
    } catch (err) {
        console.warn("Failed to parse dashboard layout", err);
    }
    return null;
};

const persistLayout = async (layout: Widget[]) => {
    if (STORAGE_MODE === "backend") {
        // TODO: send payload to backend endpoint
        return;
    }
    if (typeof window === "undefined") {
        return;
    }
    try {
        sessionStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (err) {
        console.warn("Failed to persist dashboard layout", err);
    }
};

type SortableTileProps = {
    widget: Widget;
    isEditMode: boolean;
};

const SortableTile: React.FC<SortableTileProps> = ({ widget, isEditMode }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
        useSortable({
            id: widget.id,
            disabled: !isEditMode,
        });

    const colSpan = Math.min(4, Math.max(1, widget.colSpan ?? 1));
    const rowSpan = Math.min(4, Math.max(1, widget.rowSpan ?? 1));

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        minHeight: {
            xs: `${120 * rowSpan}px`,
            md: `${170 * rowSpan}px`,
        },
        cursor: isEditMode ? "grab" : "default",
    };

    return (
        <Box
            ref={setNodeRef}
            sx={style}
            {...(isEditMode ? { ...attributes, ...listeners } : {})}
        >
            <WidgetCard widget={widget} isEditMode={isEditMode} />
        </Box>
    );
};

export default function Dashboard() {
    const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
    const [layoutReady, setLayoutReady] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        })
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const stored = await loadLayout();
            if (!cancelled && stored) {
                setWidgets(stored);
            }
            if (!cancelled) {
                setLayoutReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!layoutReady) return;
        void persistLayout(widgets);
    }, [widgets, layoutReady]);

    const handleDragEnd = (event: DragEndEvent) => {
        if (!isEditMode) return;
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }
        setWidgets((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const gridBaseStyles = {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gridAutoRows: { xs: "120px", md: "170px" },
        gridAutoFlow: "row dense",
        gap: 2,
        borderRadius: 2,
        p: 2,
        transition: "background 0.2s ease",
        position: "relative" as const,
        bgcolor: "background.paper",
    };

const gridHighlightStyles = isEditMode
    ? {
          border: "1px dashed",
          borderColor: "primary.main",
          backgroundColor: "rgba(25,118,210,0.04)",
          boxShadow: "0 0 0 4px rgba(25,118,210,0.08)",
      }
    : {};

    const handleResetLayout = () => {
        setWidgets((items) =>
            defaultWidgets.map((widget) => {
                const existing = items.find((item) => item.id === widget.id);
                return existing ?? widget;
            })
        );
        void persistLayout(defaultWidgets);
    };

    return (
        <Box sx={{ bgcolor: "grey.100", minHeight: "100vh", py: 4 }}>
            <Container maxWidth="lg">
                <Stack spacing={2} sx={{ mb: 2 }}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                        spacing={2}
                    >
                        <Typography variant="h4">FinPasser Dashboard</Typography>
                        <Stack direction="row" spacing={1}>
                            {isEditMode && (
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={handleResetLayout}
                                >
                                    Reset Layout
                                </Button>
                            )}
                            <Button
                                variant={isEditMode ? "contained" : "outlined"}
                                color="primary"
                                onClick={() => setIsEditMode((prev) => !prev)}
                            >
                                {isEditMode ? "Finish Editing" : "Edit Layout"}
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>

                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={widgets.map((w) => w.id)}
                        strategy={rectSortingStrategy}
                        disabled={!isEditMode}
                    >
                        <Box
                            sx={{
                                ...gridBaseStyles,
                                ...gridHighlightStyles,
                            }}
                        >
                            {widgets.map((widget) => (
                                <SortableTile
                                    key={widget.id}
                                    widget={widget}
                                    isEditMode={isEditMode}
                                />
                            ))}
                        </Box>
                    </SortableContext>
                </DndContext>
            </Container>
        </Box>
    );
}
