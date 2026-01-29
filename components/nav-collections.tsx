"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Folder,
  Pin,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  PinnedCollectionWithGroup,
  CollectionWithLastAccessed,
} from "@/types/library";

interface NavCollectionsProps {
  pinnedCollections: PinnedCollectionWithGroup[];
  recentCollections: CollectionWithLastAccessed[];
  onPin: (collectionId: string) => void;
  onUnpin: (collectionId: string) => void;
  onReorder: (newOrder: { id: string; position: number }[]) => void;
  syncingCollectionId?: string | null;
}

// Sortable pinned collection item
function SortablePinnedCollection({
  item,
  onUnpin,
  syncingCollectionId,
}: {
  item: PinnedCollectionWithGroup;
  onUnpin: (collectionId: string) => void;
  syncingCollectionId?: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const collectionName = Array.isArray(item.collections)
    ? item.collections[0]?.name
    : (item.collections as any)?.name || "Unnamed Collection";

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <SidebarMenuButton asChild>
        <Link href={`/library/collections/${item.collection_id}`}>
          <Folder className="text-blue-500" />
          <span className="truncate">{collectionName}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              onUnpin(item.collection_id);
            }}
            className="ml-auto"
            disabled={syncingCollectionId === item.collection_id}
            aria-label="Unpin collection"
          >
            <Pin
              className={`h-3 w-3 text-primary fill-current ${
                syncingCollectionId === item.collection_id
                  ? "animate-pulse"
                  : ""
              }`}
            />
          </button>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover
        {...attributes}
        {...listeners}
        className="cursor-move"
      >
        <GripVertical />
        <span className="sr-only">Drag to reorder</span>
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}

export function NavCollections({
  pinnedCollections,
  recentCollections,
  onPin,
  onUnpin,
  onReorder,
  syncingCollectionId = null,
}: NavCollectionsProps) {
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);
  const [isRecentOpen, setIsRecentOpen] = useState(true);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pinnedCollections.findIndex(
        (item) => item.id === active.id,
      );
      const newIndex = pinnedCollections.findIndex(
        (item) => item.id === over.id,
      );

      const newOrder = [...pinnedCollections];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      const positionUpdates = newOrder.map((item, index) => ({
        id: item.id,
        position: index + 1,
      }));

      onReorder(positionUpdates);
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Collections</SidebarGroupLabel>

      {/* Pinned Collections - Collapsible */}
      <Collapsible open={isPinnedOpen} onOpenChange={setIsPinnedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium hover:bg-muted/50 rounded transition-colors">
          <span>Pinned</span>
          {isPinnedOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {pinnedCollections.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pinnedCollections.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <SidebarMenu>
                  {pinnedCollections.map((item) => (
                    <SortablePinnedCollection
                      key={item.id}
                      item={item}
                      onUnpin={onUnpin}
                      syncingCollectionId={syncingCollectionId}
                    />
                  ))}
                </SidebarMenu>
              </SortableContext>
            </DndContext>
          ) : (
            /* Empty State */
            <div className="px-2 py-3 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground cursor-help">
                    <Info className="h-4 w-4" />
                    <span className="text-xs">No pinned collections</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    Pin collections from the collection detail page or Library
                    page for quick access
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Recent Collections - Collapsible */}
      {recentCollections.length > 0 && (
        <Collapsible open={isRecentOpen} onOpenChange={setIsRecentOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium hover:bg-muted/50 rounded transition-colors">
            <span>Recent</span>
            {isRecentOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu>
              {recentCollections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/library/collections/${collection.id}`}>
                      <Folder className="text-muted-foreground" />
                      <span className="truncate">
                        {collection.name || "Unnamed Collection"}
                      </span>
                      {/* Unfilled pin icon - clickable to pin */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onPin(collection.id);
                        }}
                        className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
                        disabled={syncingCollectionId === collection.id}
                        aria-label="Pin collection"
                      >
                        <Pin
                          className={`h-3 w-3 text-muted-foreground ${
                            syncingCollectionId === collection.id
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                      </button>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </Collapsible>
      )}
    </SidebarGroup>
  );
}
