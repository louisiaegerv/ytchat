"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (path?: string) => void;
  stopLoading: () => void;
  pendingPath: string | null;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Stop loading when route actually changes
  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
      setPendingPath(null);
    }
  }, [pathname, searchParams]);

  const startLoading = useCallback((path?: string) => {
    setIsLoading(true);
    if (path) {
      setPendingPath(path);
    }
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setPendingPath(null);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, pendingPath }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
