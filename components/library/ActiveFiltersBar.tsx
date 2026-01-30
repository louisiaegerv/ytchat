import { Badge, Button } from "@/components/ui";
import { X } from "lucide-react";

interface ActiveFiltersBarProps {
  selectedTags: string[];
  selectedCollections: string[];
  getCollectionName: (collectionId: string) => string;
  onTagRemove: (tag: string) => void;
  onCollectionRemove: (collectionId: string) => void;
  onClearAll: () => void;
}

export default function ActiveFiltersBar({
  selectedTags,
  selectedCollections,
  getCollectionName,
  onTagRemove,
  onCollectionRemove,
  onClearAll,
}: ActiveFiltersBarProps) {
  if (selectedTags.length === 0 && selectedCollections.length === 0)
    return null;

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
      {selectedCollections.map((collectionId) => (
        <Badge key={`collection-${collectionId}`} variant="outline">
          Collection: {getCollectionName(collectionId)}
          <button
            onClick={() => onCollectionRemove(collectionId)}
            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Remove collection filter for ${getCollectionName(collectionId)}`}
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
