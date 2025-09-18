import { useState, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UseItemSelectionProps {
  items: { id: string }[];
  isSelectionMode: boolean;
  setIsSelectionMode: (value: boolean) => void;
}

export const useItemSelection = ({
  items,
  isSelectionMode,
  setIsSelectionMode,
}: UseItemSelectionProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to clear selection and exit selection mode
      if (e.key === "Escape" && isSelectionMode) {
        e.preventDefault();
        setSelectedItems([]);
        setIsSelectionMode(false);
        setLastSelectedItem(null);
      }

      // Select all (Ctrl/Cmd + A)
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && items.length > 0) {
        e.preventDefault();
        setIsSelectionMode(true);
        setSelectedItems(items.map((item) => item.id));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, setIsSelectionMode, isSelectionMode]);

  const handleItemSelect = useCallback(
    (id: string, event?: React.MouseEvent | React.TouchEvent) => {
      // Handle range selection with Shift key
      if (
        !isMobile &&
        event &&
        "shiftKey" in event &&
        event.shiftKey &&
        lastSelectedItem
      ) {
        const currentIndex = items.findIndex((item) => item.id === id);
        const lastIndex = items.findIndex(
          (item) => item.id === lastSelectedItem
        );

        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);

        const itemsInRange = items.slice(start, end + 1).map((item) => item.id);
        setSelectedItems((prev) => {
          const withoutRange = prev.filter((id) => !itemsInRange.includes(id));
          return [...withoutRange, ...itemsInRange];
        });
      }
      // Handle individual selection (Ctrl/Cmd key or mobile)
      else if (
        (!isMobile &&
          event &&
          "ctrlKey" in event &&
          (event.ctrlKey || event.metaKey)) ||
        isMobile
      ) {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
        }
        setSelectedItems((prev) =>
          prev.includes(id)
            ? prev.filter((itemId) => itemId !== id)
            : [...prev, id]
        );
      }
      // Regular click in selection mode
      else if (isSelectionMode) {
        setSelectedItems((prev) =>
          prev.includes(id)
            ? prev.filter((itemId) => itemId !== id)
            : [...prev, id]
        );
      }
      // Regular click (select single item)
      else {
        setSelectedItems([id]);
      }

      setLastSelectedItem(id);
    },
    [isSelectionMode, lastSelectedItem, items, isMobile]
  );

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setLastSelectedItem(null);
  }, []);

  return {
    selectedItems,
    handleItemSelect,
    clearSelection,
  };
};
