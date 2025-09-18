"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  SetStateAction,
  Dispatch,
} from "react";

interface GlobalDataContextType {
  existingTags: Set<string>;
  setExistingTags: Dispatch<SetStateAction<Set<string>>>;
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(
  undefined
);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const [existingTags, setExistingTags] = useState<Set<string>>(new Set());

  return (
    <GlobalDataContext.Provider value={{ existingTags, setExistingTags }}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error("useGlobalData must be used within a GlobalDataProvider");
  }
  return context;
}
