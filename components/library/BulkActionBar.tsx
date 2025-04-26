import React from "react";
import { CheckCheck, Trash, Tags, Focus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onTag?: () => void;
  onAnalyze?: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onDelete,
  onTag,
  onAnalyze,
}) => {
  return (
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
  );
};

export default BulkActionBar;
