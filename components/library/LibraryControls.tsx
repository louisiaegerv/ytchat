import {
  Input,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { List, LayoutGrid, Filter, Folder } from "lucide-react";
import type { Collection } from "@/types/library";

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
}: LibraryControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="search"
        placeholder="Search by title..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-9 max-w-xs"
      />
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => setViewMode("list")}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "grid" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => setViewMode("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={allTags.length === 0}>
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter by Tag</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allTags.length > 0 ? (
            allTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => onTagSelect(tag)}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              No tags found
            </DropdownMenuLabel>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Collection Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={allCollections.length === 0}
          >
            <Folder className="h-4 w-4" />
            <span className="sr-only">Filter by Collection</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filter by Collection</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allCollections.length > 0 ? (
            allCollections.map((collection) => (
              <DropdownMenuCheckboxItem
                key={collection.id}
                checked={selectedCollections.includes(collection.id)}
                onCheckedChange={() => onCollectionSelect(collection.id)}
              >
                {collection.name || "Unnamed Collection"}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              No Collections found
            </DropdownMenuLabel>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
