"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePinnedCollections as usePinnedCollectionsHook } from "@/hooks/usePinnedCollections";
import type {
  PinnedCollectionDetails,
  CollectionWithLastAccessed,
} from "@/types/library";

interface PinnedCollectionsContextType {
  userId: string | null;
  pinnedCollections: PinnedCollectionDetails[];
  recentCollections: CollectionWithLastAccessed[];
  loading: boolean;
  error: string | null;
  pinLimit: number;
  syncingCollectionId: string | null;
  checkIsPinned: (collectionId: string) => Promise<boolean>;
  handlePin: (collectionId: string) => Promise<void>;
  handleUnpin: (collectionId: string) => Promise<void>;
  handleReplace: (
    oldCollectionId: string,
    newCollectionId: string,
  ) => Promise<void>;
  handleReorder: (
    newOrder: { id: string; position: number }[],
  ) => Promise<void>;
  handleUpdateLastAccessed: (collectionId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const PinnedCollectionsContext =
  createContext<PinnedCollectionsContextType | null>(null);

export function PinnedCollectionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pinnedCollectionsData = usePinnedCollectionsHook();

  return (
    <PinnedCollectionsContext.Provider value={pinnedCollectionsData}>
      {children}
    </PinnedCollectionsContext.Provider>
  );
}

export function usePinnedCollections() {
  const context = useContext(PinnedCollectionsContext);
  if (!context) {
    throw new Error(
      "usePinnedCollections must be used within a PinnedCollectionsProvider",
    );
  }
  return context;
}
