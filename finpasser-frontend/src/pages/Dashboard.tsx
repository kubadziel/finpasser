import React, { useEffect, useState } from "react";
import { Typography, Container, Stack, Button, Box } from "@mui/material";
import {
    DndContext,
    DragCancelEvent,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
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
import type { Widget, WidgetDefinition } from "../components/widgetTypes";
import { widgetDefinitions, widgetDefinitionMap } from "../widgets";

const LAYOUT_STORAGE_KEY = "finpasser-dashboard-layout";
const STORAGE_MODE = "session" as "session" | "backend"; // backend mode planned for future
const GRID_COLUMNS = 4;

const defaultWidgets: Widget[] = widgetDefinitions.map(({ id, rowSpan, colSpan }) => ({
    id,
    rowSpan,
    colSpan,
}));

const clampSpan = (value?: number) =>
    Math.min(GRID_COLUMNS, Math.max(1, value ?? 1));

const getClampedSpans = (widget: Widget) => ({
    colSpan: clampSpan(widget.colSpan),
    rowSpan: clampSpan(widget.rowSpan),
});

const calculateGridRows = (layout: Widget[], columns = GRID_COLUMNS) => {
    const occupancy: boolean[][] = [];
    let rowsUsed = 0;

    const ensureRows = (row: number) => {
        for (let i = occupancy.length; i <= row; i++) {
            occupancy[i] = Array(columns).fill(false);
        }
    };

    const canPlace = (
        startRow: number,
        startCol: number,
        rowSpan: number,
        colSpan: number
    ) => {
        for (let r = startRow; r < startRow + rowSpan; r++) {
            for (let c = startCol; c < startCol + colSpan; c++) {
                if (occupancy[r]?.[c]) {
                    return false;
                }
            }
        }
        return true;
    };

    const occupy = (
        startRow: number,
        startCol: number,
        rowSpan: number,
        colSpan: number
    ) => {
        ensureRows(startRow + rowSpan - 1);
        for (let r = startRow; r < startRow + rowSpan; r++) {
            for (let c = startCol; c < startCol + colSpan; c++) {
                occupancy[r][c] = true;
            }
        }
        rowsUsed = Math.max(rowsUsed, startRow + rowSpan);
    };

    layout.forEach((widget) => {
        const { colSpan, rowSpan } = getClampedSpans(widget);
        let row = 0;
        let placed = false;

        while (!placed) {
            ensureRows(row + rowSpan - 1);
            for (let col = 0; col <= columns - colSpan; col++) {
                if (canPlace(row, col, rowSpan, colSpan)) {
                    occupy(row, col, rowSpan, colSpan);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                row += 1;
            }
        }
    });

    return rowsUsed || occupancy.length;
};

const mergeWithDefaults = (layout: Widget[]): Widget[] => {
    const orderedLayout = layout.map((storedWidget) => {
        const defaultWidget = widgetDefinitionMap.get(storedWidget.id);
        if (!defaultWidget) {
            return storedWidget;
        }
        return {
            ...storedWidget,
            rowSpan: defaultWidget.rowSpan ?? storedWidget.rowSpan,
            colSpan: defaultWidget.colSpan ?? storedWidget.colSpan,
        };
    });

    const missingDefaults = widgetDefinitions
        .filter((widget) => !layout.some((stored) => stored.id === widget.id))
        .map((widget) => ({
            id: widget.id,
            rowSpan: widget.rowSpan,
            colSpan: widget.colSpan,
        }));

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
    definition: WidgetDefinition;
    isEditMode: boolean;
};

const SortableTile: React.FC<SortableTileProps> = ({
    widget,
    definition,
    isEditMode,
}) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
        useSortable({
            id: widget.id,
            disabled: !isEditMode,
        });

    const { colSpan, rowSpan } = getClampedSpans(widget);

    const style = {
        transform: isDragging ? undefined : CSS.Transform.toString(transform),
        transition: isDragging
            ? "transform 160ms cubic-bezier(0.2, 0, 0, 1), opacity 140ms ease"
            : transition ?? "transform 220ms cubic-bezier(0.2, 0, 0, 1), opacity 180ms ease",
        opacity: isDragging ? 0.65 : 1,
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        minHeight: {
            xs: `${120 * rowSpan}px`,
            md: `${170 * rowSpan}px`,
        },
        cursor: isEditMode ? "grab" : "default",
        willChange: "transform",
    };

    const TileContent = definition.component;

    return (
        <Box
            ref={setNodeRef}
            sx={style}
            {...(isEditMode ? { ...attributes, ...listeners } : {})}
        >
            <TileContent isEditMode={isEditMode} />
        </Box>
    );
};

export default function Dashboard() {
    const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
    const [layoutReady, setLayoutReady] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeSize, setActiveSize] = useState<{ width: number; height: number } | null>(
        null
    );
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

    const activeWidget = activeId
        ? widgets.find((widget) => widget.id === activeId) ?? null
        : null;
    const activeDefinition = activeWidget
        ? widgetDefinitionMap.get(activeWidget.id) ?? null
        : null;
    const OverlayComponent = activeDefinition?.component ?? null;
    const overlaySpans = activeWidget ? getClampedSpans(activeWidget) : null;

    const handleDragStart = (event: DragStartEvent) => {
        if (!isEditMode) return;
        setActiveId(String(event.active.id));
        const rect = event.active.rect.current.translated ?? event.active.rect.current.initial;
        if (rect) {
            setActiveSize({ width: rect.width, height: rect.height });
        } else {
            setActiveSize(null);
        }
    };

    const clearActiveDrag = () => {
        setActiveId(null);
        setActiveSize(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (!isEditMode) {
            clearActiveDrag();
            return;
        }
        const { active, over } = event;
        clearActiveDrag();
        if (!over || active.id === over.id) {
            return;
        }
        setWidgets((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            if (oldIndex === -1 || newIndex === -1) {
                return items;
            }
            const nextLayout = arrayMove(items, oldIndex, newIndex);
            const currentRows = calculateGridRows(items);
            const nextRows = calculateGridRows(nextLayout);

            if (nextRows > currentRows) {
                return items;
            }

            return nextLayout;
        });
    };

    const handleDragCancel = (_event: DragCancelEvent) => {
        clearActiveDrag();
    };

    const gridBaseStyles = {
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
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

                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
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
                            {widgets.map((widget) => {
                                const definition = widgetDefinitionMap.get(widget.id);
                                if (!definition) return null;
                                return (
                                    <SortableTile
                                        key={widget.id}
                                        widget={widget}
                                        definition={definition}
                                        isEditMode={isEditMode}
                                    />
                                );
                            })}
                        </Box>
                    </SortableContext>

                    <DragOverlay
                        adjustScale={false}
                        dropAnimation={{
                            duration: 220,
                            easing: "cubic-bezier(0.2, 0, 0, 1)",
                        }}
                    >
                        {activeWidget && OverlayComponent ? (
                            <Box
                                sx={{
                                    width: activeSize?.width,
                                    height:
                                        activeSize?.height ??
                                        (overlaySpans
                                            ? {
                                                  xs: `${120 * overlaySpans.rowSpan}px`,
                                                  md: `${170 * overlaySpans.rowSpan}px`,
                                              }
                                            : undefined),
                                    minWidth: 0,
                                }}
                            >
                                <OverlayComponent
                                    isEditMode
                                    cardProps={{ sx: { boxShadow: 8 } }}
                                />
                            </Box>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </Container>
        </Box>
    );
}
