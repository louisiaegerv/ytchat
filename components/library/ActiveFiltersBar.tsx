import { Badge, Button } from "@/components/ui";
import { X } from "lucide-react";

interface ActiveFiltersBarProps {
  selectedTags: string[];
  selectedGroups: string[];
  getGroupName: (groupId: string) => string;
  onTagRemove: (tag: string) => void;
  onGroupRemove: (groupId: string) => void;
  onClearAll: () => void;
}

export default function ActiveFiltersBar({
  selectedTags,
  selectedGroups,
  getGroupName,
  onTagRemove,
  onGroupRemove,
  onClearAll,
}: ActiveFiltersBarProps) {
  if (selectedTags.length === 0 && selectedGroups.length === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-2 flex-wrap border-b pb-4">
      <span className="text-sm font-medium">Active Filters:</span>
      {selectedTags.map((tag) => (
        <Badge key={`tag-${tag}`} variant="secondary">
          Tag: {tag}
          <button
            onClick={() => onTagRemove(tag)}
            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Remove tag filter for ${tag}`}
            type="button"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </Badge>
      ))}
      {selectedGroups.map((groupId) => (
        <Badge key={`group-${groupId}`} variant="outline">
          Group: {getGroupName(groupId)}
          <button
            onClick={() => onGroupRemove(groupId)}
            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Remove group filter for ${getGroupName(groupId)}`}
            type="button"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-auto p-1 text-xs"
        type="button"
      >
        Clear All Filters
      </Button>
    </div>
  );
}
