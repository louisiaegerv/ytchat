"use client";

import { Badge, Button } from "@/components/ui";
import { X, Calendar } from "lucide-react";

interface DateFilter {
  type: "added" | "published" | "all";
  range: "all" | "today" | "week" | "month" | "year";
}

interface ActiveFiltersBarProps {
  selectedTags: string[];
  selectedCollections: string[];
  getCollectionName?: (collectionId: string) => string;
  dateFilter?: DateFilter;
  onTagRemove: (tag: string) => void;
  onCollectionRemove: (collectionId: string) => void;
  onDateFilterRemove?: () => void;
  onClearAll: () => void;
}

export default function ActiveFiltersBar({
  selectedTags,
  selectedCollections,
  getCollectionName,
  dateFilter,
  onTagRemove,
  onCollectionRemove,
  onDateFilterRemove,
  onClearAll,
}: ActiveFiltersBarProps) {
  const hasDateFilter = dateFilter?.range && dateFilter.range !== "all";
  
  const hasAnyFilters = selectedTags.length > 0 || 
                        selectedCollections.length > 0 || 
                        hasDateFilter;
  
  if (!hasAnyFilters) {
    return null;
  }

  const getDateFilterLabel = () => {
    if (!dateFilter || !dateFilter.range || dateFilter.range === "all") return "";
    
    const typeLabel = dateFilter.type === "added" ? "Added" : "Published";
    const rangeLabel: Record<string, string> = {
      today: "Today",
      week: "This Week",
      month: "This Month",
      year: "This Year",
    };
    
    return `${typeLabel}: ${rangeLabel[dateFilter.range] || dateFilter.range}`;
  };

  const getDateFilterColor = () => {
    if (dateFilter?.type === "added") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
    if (dateFilter?.type === "published") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="mb-6 flex items-center gap-2 flex-wrap border-b pb-4">
      <span className="text-sm font-medium text-muted-foreground">Active:</span>
      
      {hasDateFilter && (
        <Badge 
          variant="outline" 
          className={`gap-1.5 ${getDateFilterColor()}`}
        >
          <Calendar className="h-3 w-3" />
          {getDateFilterLabel()}
          <button
            onClick={onDateFilterRemove}
            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Remove date filter"
            type="button"
          >
            <X className="h-3 w-3 hover:text-foreground" />
          </button>
        </Badge>
      )}
      
      {selectedTags.map((tag) => (
        <Badge key={`tag-${tag}`} variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
          Tag: {tag}
          <button
            onClick={() => onTagRemove(tag)}
            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Remove tag filter for ${tag}`}
            type="button"
          >
            <X className="h-3 w-3 hover:text-foreground" />
          </button>
        </Badge>
      ))}
      
      {selectedCollections.map((collectionId) => (
        <Badge key={`collection-${collectionId}`} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
          Collection: {getCollectionName ? getCollectionName(collectionId) : collectionId}
          <button
            onClick={() => onCollectionRemove(collectionId)}
            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Remove collection filter`}
            type="button"
          >
            <X className="h-3 w-3 hover:text-foreground" />
          </button>
        </Badge>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
        type="button"
      >
        Clear all
      </Button>
    </div>
  );
}
