"use client";

import Link from "next/link";
import { useState } from "react";
import { useLoading } from "@/components/LoadingProvider";
import {
  Folder,
  Pin,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Clock,
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
} from "@/components/ui/sidebar";
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
import { cn } from "@/lib/utils";
import type {
  PinnedCollectionDetails,
  CollectionWithLastAccessed,
} from "@/types/library";

interface NavCollectionsProps {
  pinnedCollections: PinnedCollectionDetails[];
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
  item: PinnedCollectionDetails;
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

  const { startLoading } = useLoading();
  
  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <div className={cn(
        "w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 sidebar-nav-item group",
        "text-gray-300 hover:bg-white/5 hover:text-white",
      )}>
        <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <Link
          href={`/collections/${item.collection_id}`}
          onClick={() => startLoading(`/collections/${item.collection_id}`)}
          className="truncate flex-1"
        >
          {collectionName}
        </Link>
        {/* Action buttons container */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Pin button - always visible */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onUnpin(item.collection_id);
            }}
            className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
            disabled={syncingCollectionId === item.collection_id}
            aria-label="Unpin collection"
          >
            <Pin
              className={cn(
                "h-3.5 w-3.5 text-blue-400 fill-current",
                syncingCollectionId === item.collection_id && "animate-pulse",
              )}
            />
          </button>
          {/* Drag handle - visible on hover */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-md opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-white/10 cursor-move transition-all"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      </div>
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
  const { startLoading } = useLoading();

  // Create a Set of pinned collection IDs for O(1) lookup
  const pinnedCollectionIds = new Set(
    pinnedCollections.map((p) => p.collection_id),
  );

  // Filter recent collections to exclude any that are currently pinned
  const filteredRecentCollections = recentCollections.filter(
    (collection) => !pinnedCollectionIds.has(collection.id),
  );

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
    <SidebarGroup className="group-data-[collapsible=icon]:hidden px-0 py-0">
      <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Collections
      </SidebarGroupLabel>

      {/* Pinned Collections - Collapsible */}
      <Collapsible open={isPinnedOpen} onOpenChange={setIsPinnedOpen}>
        <CollapsibleTrigger
          className={cn(
            "w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            "text-gray-400 hover:text-white hover:bg-white/5",
          )}
        >
          <span>Pinned</span>
          {isPinnedOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-0.5">
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
                <SidebarMenu className="gap-0">
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
            <div className="px-4 py-3 text-center">
              <div className="text-xs text-gray-500 italic">
                No pinned collections
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Recent Collections - Collapsible */}
      {filteredRecentCollections.length > 0 && (
        <Collapsible
          open={isRecentOpen}
          onOpenChange={setIsRecentOpen}
          className="mt-1"
        >
          <CollapsibleTrigger
            className={cn(
              "w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              "text-gray-400 hover:text-white hover:bg-white/5",
            )}
          >
            <span>Recent</span>
            {isRecentOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-0.5">
            <SidebarMenu className="gap-0">
              {filteredRecentCollections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <div className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 sidebar-nav-item group",
                    "text-gray-300 hover:bg-white/5 hover:text-white",
                  )}>
                    <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Link
                      href={`/collections/${collection.id}`}
                      onClick={() => startLoading(`/collections/${collection.id}`)}
                      className="truncate flex-1"
                    >
                      {collection.name || "Unnamed Collection"}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onPin(collection.id);
                      }}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
                      disabled={syncingCollectionId === collection.id}
                      aria-label="Pin collection"
                    >
                      <Pin
                        className={cn(
                          "h-3 w-3 text-gray-400 hover:text-blue-400",
                          syncingCollectionId === collection.id &&
                            "animate-pulse",
                        )}
                      />
                    </button>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </Collapsible>
      )}
    </SidebarGroup>
  );
}
