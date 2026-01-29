"use client";

import { useEffect } from "react";

interface KeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  enabled?: boolean;
}

/**
 * Custom hook to handle keyboard shortcuts.
 *
 * @param options - Keyboard shortcut configuration
 * @param options.key - The key to listen for (e.g., "c", "Enter", "Escape")
 * @param options.ctrlKey - Whether Ctrl key must be pressed (default: false)
 * @param options.shiftKey - Whether Shift key must be pressed (default: false)
 * @param options.altKey - Whether Alt key must be pressed (default: false)
 * @param options.metaKey - Whether Meta/Command key must be pressed (default: false)
 * @param options.handler - Function to execute when shortcut is triggered
 * @param options.enabled - Whether the shortcut is active (default: true)
 *
 * @example
 * ```tsx
 * useKeyboardShortcut({
 *   key: "c",
 *   ctrlKey: true,
 *   shiftKey: true,
 *   handler: () => console.log("Ctrl+Shift+C pressed"),
 * });
 * ```
 */
export function useKeyboardShortcut({
  key,
  ctrlKey = false,
  shiftKey = false,
  altKey = false,
  metaKey = false,
  handler,
  enabled = true,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();

      // Check if modifier keys match
      const ctrlMatches = event.ctrlKey === ctrlKey;
      const shiftMatches = event.shiftKey === shiftKey;
      const altMatches = event.altKey === altKey;
      const metaMatches = event.metaKey === metaKey;

      // If all conditions match, execute handler and prevent default
      if (
        keyMatches &&
        ctrlMatches &&
        shiftMatches &&
        altMatches &&
        metaMatches
      ) {
        event.preventDefault();
        handler();
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, ctrlKey, shiftKey, altKey, metaKey, handler, enabled]);
}
