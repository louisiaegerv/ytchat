import { useState, useMemo } from "react";
import {
  Input,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Badge,
  ScrollArea,
} from "@/components/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { List, LayoutGrid, Filter, SlidersHorizontal, Check, Search, X } from "lucide-react";
import type { Collection } from "@/types/library";
import { cn } from "@/lib/utils";

interface DateFilter {
  type: "added" | "published" | "all";
  range: "all" | "today" | "week" | "month" | "year";
}

type SortOption = "newest_added" | "oldest_added" | "newest_published" | "oldest_published";

interface LibraryControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: "list" | "grid";
  setViewMode: (mode: "list" | "grid") => void;
  allTags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  allCollections: Collection[];
  selectedCollections: string[];
  onCollectionSelect: (collectionId: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function LibraryControls({
  searchQuery,
  onSearchChange,
  viewMode,
  setViewMode,
  allTags,
  selectedTags,
  onTagSelect,
  allCollections,
  selectedCollections,
  onCollectionSelect,
  dateFilter,
  onDateFilterChange,
  sortBy,
  onSortChange,
}: LibraryControlsProps) {
  const [open, setOpen] = useState(false);
  
  // Search states for filter sections
  const [tagSearch, setTagSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return allTags;
    const searchLower = tagSearch.toLowerCase();
    return allTags.filter(tag => tag.toLowerCase().includes(searchLower));
  }, [allTags, tagSearch]);

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    if (!collectionSearch.trim()) return allCollections;
    const searchLower = collectionSearch.toLowerCase();
    return allCollections.filter(c => 
      (c.name || "").toLowerCase().includes(searchLower)
    );
  }, [allCollections, collectionSearch]);

  // Show selected items first in the list
  const sortedTags = useMemo(() => {
    const selected = filteredTags.filter(t => selectedTags.includes(t));
    const unselected = filteredTags.filter(t => !selectedTags.includes(t));
    return [...selected, ...unselected];
  }, [filteredTags, selectedTags]);

  const sortedCollections = useMemo(() => {
    const selected = filteredCollections.filter(c => selectedCollections.includes(c.id));
    const unselected = filteredCollections.filter(c => !selectedCollections.includes(c.id));
    return [...selected, ...unselected];
  }, [filteredCollections, selectedCollections]);

  const getSortLabel = (sort: SortOption) => {
    const labels: Record<SortOption, string> = {
      newest_added: "Newest Added",
      oldest_added: "Oldest Added",
      newest_published: "Newest Published",
      oldest_published: "Oldest Published",
    };
    return labels[sort];
  };

  const getSectionSummary = () => {
    const parts: string[] = [];
    
    if (sortBy !== "newest_added") {
      parts.push(getSortLabel(sortBy));
    }
    
    if (dateFilter.range !== "all") {
      const rangeLabel = {
        today: "Today",
        week: "This Week",
        month: "This Month",
        year: "This Year",
      }[dateFilter.range];
      parts.push(`${dateFilter.type === "added" ? "Added" : "Published"}: ${rangeLabel}`);
    }
    
    if (selectedTags.length > 0) {
      parts.push(`${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""}`);
    }
    
    if (selectedCollections.length > 0) {
      parts.push(`${selectedCollections.length} collection${selectedCollections.length > 1 ? "s" : ""}`);
    }
    
    return parts;
  };

  const activeFiltersCount = 
    selectedTags.length + 
    selectedCollections.length + 
    (dateFilter.range !== "all" ? 1 : 0) +
    (sortBy !== "newest_added" ? 1 : 0);

  const clearAllFilters = () => {
    selectedTags.forEach(tag => onTagSelect(tag));
    selectedCollections.forEach(id => onCollectionSelect(id));
    onDateFilterChange({ type: "all", range: "all" });
    onSortChange("newest_added");
    setTagSearch("");
    setCollectionSearch("");
  };

  const hasActiveFilters = activeFiltersCount > 0;
  const summary = getSectionSummary();

  return (
    <div className="flex items-center gap-2">
      <Input
        type="search"
        placeholder="Search videos..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-9 w-[200px] lg:w-[280px]"
      />
      
      {/* View Mode Toggle */}
      <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setViewMode("list")}
          className="h-7 w-7"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setViewMode("grid")}
          className="h-7 w-7"
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>

      {/* Unified Filter Dropdown */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            size="sm"
            className="gap-2 relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge 
                variant="secondary" 
                className="h-5 min-w-5 px-1.5 text-xs bg-background text-foreground"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="font-semibold">Filters & Sort</span>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset all
              </Button>
            )}
          </div>

          {/* Summary pills when filters are active */}
          {summary.length > 0 && (
            <div className="px-4 py-2 border-b bg-muted/20">
              <div className="flex flex-wrap gap-1.5">
                {summary.map((item, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="text-xs bg-primary/10 text-primary border-0"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Sections */}
          <div className="max-h-[60vh] overflow-auto">
            <Accordion 
              type="multiple" 
              defaultValue={["sort", "date-added"]}
              className="w-full"
            >
              {/* Sort Section */}
              <AccordionItem value="sort" className="border-b">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Sort By</span>
                    {sortBy !== "newest_added" && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-primary/10 text-primary border-0">
                        {getSortLabel(sortBy)}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "newest_added", label: "Newest Added" },
                      { value: "oldest_added", label: "Oldest Added" },
                      { value: "newest_published", label: "Newest Published" },
                      { value: "oldest_published", label: "Oldest Published" },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                          sortBy === option.value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        )}
                      >
                        {option.label}
                        {sortBy === option.value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Date Added Section */}
              <AccordionItem value="date-added" className="border-b">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Date Added</span>
                    {dateFilter.type === "added" && dateFilter.range !== "all" && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-blue-500/10 text-blue-400 border-0">
                        {{
                          today: "Today",
                          week: "This Week",
                          month: "This Month",
                          year: "This Year",
                        }[dateFilter.range]}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "All Time" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                      { value: "year", label: "This Year" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onDateFilterChange({ 
                          type: "added", 
                          range: option.value as DateFilter["range"] 
                        })}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm transition-all border",
                          dateFilter.type === "added" && dateFilter.range === option.value
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                            : "bg-background hover:bg-muted border-border text-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Date Published Section */}
              <AccordionItem value="date-published" className="border-b">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Date Published</span>
                    {dateFilter.type === "published" && dateFilter.range !== "all" && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-emerald-500/10 text-emerald-400 border-0">
                        {{
                          today: "Today",
                          week: "This Week",
                          month: "This Month",
                          year: "This Year",
                        }[dateFilter.range]}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "All Time" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                      { value: "year", label: "This Year" },
                    ].map((option) => (
                      <button
                        key={`pub-${option.value}`}
                        onClick={() => onDateFilterChange({ 
                          type: "published", 
                          range: option.value as DateFilter["range"] 
                        })}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm transition-all border",
                          dateFilter.type === "published" && dateFilter.range === option.value
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-background hover:bg-muted border-border text-foreground"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Tags Section with Search */}
              {allTags.length > 0 && (
                <AccordionItem value="tags" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Tags</span>
                      {selectedTags.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-violet-500/10 text-violet-400 border-0">
                          {selectedTags.length} selected
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {/* Tag Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${allTags.length.toLocaleString()} tags...`}
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="h-8 pl-9 text-sm"
                      />
                      {tagSearch && (
                        <button
                          onClick={() => setTagSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                    
                    {/* Selected Tags Summary */}
                    {selectedTags.length > 0 && !tagSearch && (
                      <div className="mb-2 text-xs text-muted-foreground">
                        {selectedTags.length} selected
                      </div>
                    )}
                    
                    {/* Filtered Tags List */}
                    <ScrollArea className="h-48">
                      <div className="flex flex-wrap gap-1.5 pr-4">
                        {sortedTags.length > 0 ? (
                          sortedTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => onTagSelect(tag)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm transition-all border flex items-center gap-1.5",
                                selectedTags.includes(tag)
                                  ? "bg-violet-500 text-white border-violet-500 shadow-sm"
                                  : "bg-background hover:bg-muted border-border text-foreground"
                              )}
                            >
                              {tag}
                              {selectedTags.includes(tag) && <Check className="h-3 w-3" />}
                            </button>
                          ))
                        ) : (
                          <div className="w-full py-8 text-center text-sm text-muted-foreground">
                            No tags match &quot;{tagSearch}&quot;
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* Show count when filtered */}
                    {tagSearch && (
                      <div className="mt-2 text-xs text-muted-foreground text-center">
                        Showing {filteredTags.length} of {allTags.length} tags
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Collections Section with Search */}
              {allCollections.length > 0 && (
                <AccordionItem value="collections" className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Collections</span>
                      {selectedCollections.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-amber-500/10 text-amber-400 border-0">
                          {selectedCollections.length} selected
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {/* Collection Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${allCollections.length.toLocaleString()} collections...`}
                        value={collectionSearch}
                        onChange={(e) => setCollectionSearch(e.target.value)}
                        className="h-8 pl-9 text-sm"
                      />
                      {collectionSearch && (
                        <button
                          onClick={() => setCollectionSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                    
                    {/* Selected Collections Summary */}
                    {selectedCollections.length > 0 && !collectionSearch && (
                      <div className="mb-2 text-xs text-muted-foreground">
                        {selectedCollections.length} selected
                      </div>
                    )}
                    
                    {/* Filtered Collections List */}
                    <ScrollArea className="h-48">
                      <div className="space-y-1 pr-4">
                        {sortedCollections.length > 0 ? (
                          sortedCollections.map((collection) => (
                            <button
                              key={collection.id}
                              onClick={() => onCollectionSelect(collection.id)}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left border",
                                selectedCollections.includes(collection.id)
                                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                  : "bg-background hover:bg-muted border-border text-foreground"
                              )}
                            >
                              <span className="truncate">{collection.name || "Unnamed Collection"}</span>
                              {selectedCollections.includes(collection.id) && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          ))
                        ) : (
                          <div className="w-full py-8 text-center text-sm text-muted-foreground">
                            No collections match &quot;{collectionSearch}&quot;
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* Show count when filtered */}
                    {collectionSearch && (
                      <div className="mt-2 text-xs text-muted-foreground text-center">
                        Showing {filteredCollections.length} of {allCollections.length} collections
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/30">
            <Button 
              className="w-full" 
              size="sm"
              onClick={() => {
                setTagSearch("");
                setCollectionSearch("");
                setOpen(false);
              }}
            >
              Apply Filters
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
