"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Boxes,
  Plus,
  Search,
  Link as LinkIcon,
  WifiCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CaptureModal } from "@/components/capture-modal";
import { RadarModal } from "@/components/radar-modal";

/**
 * Responsive bottom navigation component for mobile and desktop layouts.
 *
 * Mobile Layout (<768px):
 * - Top sticky header with page title and search icon
 * - Bottom tab bar with Library, FAB, and Stream Hub
 *
 * Desktop Layout (≥768px):
 * - Bottom tab bar with Library, FAB, and Stream Hub (icons only)
 */
export function BottomNavigation() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isStreamAutomationModalOpen, setIsStreamAutomationModalOpen] =
    useState(false);

  // Function to get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/library") return "Library";
    if (pathname === "/stream-hub") return "Stream Hub";
    if (pathname === "/capture") return "Capture";
    if (pathname === "/settings") return "Settings";
    if (pathname.startsWith("/videos/")) return "Video Details";
    if (pathname === "/") return "Home";
    return "Slipstream";
  };

  // Check if a route is active
  const isActive = (path: string) => pathname === path;

  // Handle Video Scan option click
  const handleVideoScanClick = () => {
    setIsDrawerOpen(false);
    setIsCaptureModalOpen(true);
  };

  // Handle Stream Automation option click
  const handleStreamAutomationClick = () => {
    setIsDrawerOpen(false);
    setIsStreamAutomationModalOpen(true);
  };

  return (
    <>
      {/* Mobile Top Header */}
      {isMobile && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Page Title */}
            <h1 className="text-lg font-semibold text-primary">
              {getPageTitle()}
            </h1>

            {/* Search Icon */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Bottom Tab Bar */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border"
          style={{
            paddingBottom: "max(0px, env(safe-area-inset-bottom))",
            paddingLeft: "max(0px, env(safe-area-inset-left))",
            paddingRight: "max(0px, env(safe-area-inset-right))",
          }}
        >
          <div className="flex items-center justify-around px-2 py-2 md:px-3 md:py-3">
            {/* Library Button */}
            <Link href="/library">
              <Button
                variant={"ghost"}
                size={isMobile ? "default" : "icon"}
                className={cn(
                  "flex items-center gap-2",
                  isActive("/library") && "text-primary",
                  !isActive("/library") && "text-muted-foreground",
                )}
              >
                <BookOpen className="h-5 w-5" />
              </Button>
            </Link>

            {/* FAB (Floating Action Button) - Centered and breaks top border */}
            <div className="relative">
              <Button
                variant="default"
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full bg-primary text-primary-foreground",
                  "shadow-lg hover:bg-primary/90 hover:shadow-xl",
                  "transition-all duration-200 ease-in-out",
                  // Position to break the top border
                  isMobile ? "-mt-8" : "-mt-6",
                )}
                aria-label="Add new"
                onClick={() => setIsDrawerOpen(true)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>

            {/* Stream Hub Button */}
            <Link href="/stream-hub">
              <Button
                variant={"ghost"}
                size={isMobile ? "default" : "icon"}
                className={cn(
                  "flex items-center gap-2",
                  isActive("/stream-hub") && "text-primary",
                  !isActive("/stream-hub") && "text-muted-foreground",
                )}
              >
                <Boxes className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </nav>
      )}

      {/* Bottom Drawer/Sheet */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Create New</SheetTitle>
            <SheetDescription>Choose an option to get started</SheetDescription>
          </SheetHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12 px-4"
              onClick={handleVideoScanClick}
            >
              <LinkIcon className="h-5 w-5 mr-3" />
              <span className="text-base">Video Scan</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 px-4"
              onClick={handleStreamAutomationClick}
            >
              <WifiCog className="h-5 w-5 mr-3" />
              <span className="text-base">Stream Automation</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Capture Modal */}
      <CaptureModal
        open={isCaptureModalOpen}
        onOpenChange={setIsCaptureModalOpen}
      />

      {/* Stream Automation Modal */}
      <RadarModal
        open={isStreamAutomationModalOpen}
        onOpenChange={setIsStreamAutomationModalOpen}
      />
    </>
  );
}
