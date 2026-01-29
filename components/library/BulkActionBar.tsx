"use client";

import React, { useState } from "react";
import {
  CheckCheck,
  Trash,
  Tags,
  Focus,
  Eye,
  EyeOff,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CollectionSelectorDialog from "@/components/library/CollectionSelectorDialog";
import { addVideosToCollection } from "@/app/actions";
import { toastSuccess, toastError } from "@/components/ui/toast";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onTag?: () => void;
  onAnalyze?: () => void;
  onToggleBlur?: () => void;
  selectedVideoIds?: string[];
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onDelete,
  onTag,
  onAnalyze,
  onToggleBlur,
  selectedVideoIds = [],
}) => {
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  const handleAddToCollection = async (selectedCollectionIds: string[]) => {
    console.log("🔍 [BulkActionBar] handleAddToCollection called");
    console.log("🔍 [BulkActionBar] selectedVideoIds:", selectedVideoIds);
    console.log(
      "🔍 [BulkActionBar] selectedCollectionIds:",
      selectedCollectionIds,
    );
    console.log(
      "🔍 [BulkActionBar] selectedVideoIds.length:",
      selectedVideoIds.length,
    );
    console.log(
      "🔍 [BulkActionBar] selectedCollectionIds.length:",
      selectedCollectionIds.length,
    );

    if (selectedVideoIds.length === 0 || selectedCollectionIds.length === 0) {
      console.log(
        "🔍 [BulkActionBar] Early return - no videos or collections selected",
      );
      return;
    }

    setIsAddingToCollection(true);
    try {
      for (const collectionId of selectedCollectionIds) {
        console.log(
          "🔍 [BulkActionBar] Calling addVideosToCollection for collectionId:",
          collectionId,
        );
        await addVideosToCollection(collectionId, selectedVideoIds);
      }
      toastSuccess({
        message: `Added ${selectedVideoIds.length} video${selectedVideoIds.length !== 1 ? "s" : ""} to ${selectedCollectionIds.length} collection${selectedCollectionIds.length !== 1 ? "s" : ""}`,
      });
      onClearSelection();
    } catch (error: any) {
      console.error(
        "🔍 [BulkActionBar] Error in handleAddToCollection:",
        error,
      );
      toastError(error.message || "Failed to add videos to collections");
    } finally {
      setIsAddingToCollection(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mt-2 mb-4 p-2 border rounded-md shadow-sm">
        <div className="font-medium text-sm">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </div>
        <div className="flex-grow" />
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="gap-2"
          disabled={selectedCount === 0}
        >
          <CheckCheck size={16} />
          <span className="hidden sm:inline-block">Clear Selection</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTag}
          className="gap-2"
          disabled={!onTag || selectedCount === 0}
        >
          <Tags size={16} />
          <span className="hidden sm:inline-block">Tag</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAnalyze}
          className="gap-2"
          disabled={!onAnalyze || selectedCount === 0}
        >
          <Focus size={16} />
          <span className="hidden sm:inline-block">Analyze</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleBlur}
          className="gap-2"
          disabled={!onToggleBlur || selectedCount === 0}
        >
          {/* Icon hint only; actual choice of Eye/EyeOff is determined by majority rule in container */}
          <Eye size={16} />
          <span className="hidden sm:inline-block">Blur/Unblur</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCollectionDialog(true)}
          className="gap-2"
          disabled={selectedCount === 0}
        >
          <FolderPlus size={16} />
          <span className="hidden sm:inline-block">Add to Collection</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="gap-2"
          disabled={selectedCount === 0}
        >
          <Trash size={16} />
          <span className="hidden sm:inline-block">Delete</span>
        </Button>
      </div>
      <CollectionSelectorDialog
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
        onConfirm={handleAddToCollection}
      />
    </>
  );
};

export default BulkActionBar;
