"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import * as React from "react";
import { useLoading } from "@/components/LoadingProvider";
import {
  LayoutDashboard,
  Video,
  Folder,
  FileText,
  RefreshCw,
  Plus,
  Link as LinkIcon,
  WifiCog,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { NavCollections } from "@/components/nav-collections";
import PinLimitDialog from "@/components/library/PinLimitDialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useUserId } from "@/hooks/queries/useUserQuery";
import {
  usePinnedCollectionsQuery,
  useRecentCollectionsQuery,
} from "@/hooks/queries/usePinnedCollectionsQuery";
import { usePinnedCollectionMutations } from "@/hooks/mutations/usePinnedCollectionMutations";
import { CaptureModal } from "@/components/capture-modal";
import { RadarModal } from "@/components/radar-modal";
import { SettingsModal } from "@/components/settings-modal";

// Navigation items for the new dashboard architecture
const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    shortcut: "",
  },
  {
    title: "Videos",
    url: "/videos",
    icon: Video,
    shortcut: "",
  },
  {
    title: "Collections",
    url: "/collections",
    icon: Folder,
    shortcut: "",
  },
  {
    title: "Streams",
    url: "/streams",
    icon: RefreshCw,
    shortcut: "",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    shortcut: "",
  },
];

// Export a lightweight copy of the sidebar data (titles + urls only) for reuse (e.g., breadcrumbs).
export const __sidebarData__ = {
  navMain: navItems.map((item) => ({
    title: item.title,
    url: item.url,
  })),
};

// Custom SidebarTrigger with panel-edge design and chevron icons
const CustomSidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, onClick, ...props }, ref) => {
  const { state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  const button = (
    <button
      ref={ref}
      data-sidebar="trigger"
      aria-label="Toggle Sidebar"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      className={cn(
        // Fixed positioning: on the right edge of sidebar, vertically centered
        // Adjust left position based on sidebar state (16rem expanded, 4rem collapsed)
        "fixed top-1/2 z-50 -translate-y-1/2",
        state === "expanded"
          ? "left-[calc(16rem-1rem)]"
          : "left-[calc(4rem-1rem)]",
        // Hidden by default, show on sidebar hover
        "opacity-0 group-hover:opacity-100",
        // Button styling
        "flex h-8 w-8 items-center justify-center rounded-full",
        "bg-[#0f172a] border border-white/10",
        "shadow-lg shadow-black/20",
        "text-gray-400 hover:text-white",
        "transition-all duration-200",
        "hover:border-blue-500/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
        "focus-visible:opacity-100",
        className,
      )}
      {...props}
    >
      {state === "expanded" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );

  if (isMobile) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        <div className="flex flex-col gap-1 z-50">
          <p>
            <span className="mr-2">
              {state === "collapsed" ? "Expand" : "Collapse"}{" "}
            </span>
            <KbdGroup>
              <Kbd>Alt + /</Kbd>
            </KbdGroup>
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});
CustomSidebarTrigger.displayName = "CustomSidebarTrigger";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const { pendingPath, isLoading } = useLoading();
  
  // Use pending path for immediate active state feedback during navigation
  const activePath = pendingPath || pathname;
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: "Loading...",
    email: "",
    avatar: "/avatars/user.jpg",
  });
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [isStreamAutomationModalOpen, setIsStreamAutomationModalOpen] =
    useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTriggerRef = React.useRef<HTMLButtonElement>(null);

  // Pin limit dialog state
  const [isPinLimitDialogOpen, setIsPinLimitDialogOpen] = useState(false);
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(
    null,
  );

  // React Query hooks for pinned collections
  const { userId } = useUserId();
  const { data: pinnedCollections = [], isLoading: pinnedLoading } =
    usePinnedCollectionsQuery(userId);
  const { data: recentCollections = [], isLoading: recentLoading } =
    useRecentCollectionsQuery(
      userId,
      pinnedCollections.map((p) => p.collection_id),
    );
  const {
    pinCollection,
    unpinCollection,
    handleReorder,
    isPinning,
    isUnpinning,
    isReordering,
  } = usePinnedCollectionMutations();

  const syncingCollectionId =
    isPinning || isUnpinning || isReordering ? "syncing" : null;

  const handlePinWithLimit = useCallback(
    async (collectionId: string) => {
      if (!userId) return;
      try {
        await pinCollection({ userId, collectionId });
      } catch (error: any) {
        if (error.message === "PIN_LIMIT_REACHED") {
          setPendingCollectionId(collectionId);
          setIsPinLimitDialogOpen(true);
        } else {
          console.error("Error pinning collection:", error);
        }
      }
    },
    [userId, pinCollection],
  );

  const handleUnpin = useCallback(
    async (collectionId: string) => {
      if (!userId) return;
      try {
        await unpinCollection({ userId, collectionId });
      } catch (error: any) {
        console.error("Error unpinning collection:", error);
      }
    },
    [userId, unpinCollection],
  );

  const handleReorderPinned = useCallback(
    async (newOrder: { id: string; position: number }[]) => {
      if (!userId) return;
      try {
        await handleReorder({ userId, newOrder });
      } catch (error: any) {
        console.error("Error reordering pinned collections:", error);
      }
    },
    [userId, handleReorder],
  );

  const handleReplaceFromDialog = useCallback(
    async (oldCollectionId: string, newCollectionId: string) => {
      if (!userId) return;
      try {
        await unpinCollection({ userId, collectionId: oldCollectionId });
        await pinCollection({ userId, collectionId: newCollectionId });
        setIsPinLimitDialogOpen(false);
        setPendingCollectionId(null);
      } catch (error: any) {
        console.error("Error replacing pinned collection:", error);
      }
    },
    [userId, pinCollection, unpinCollection],
  );

  useKeyboardShortcut({
    key: "n",
    altKey: true,
    handler: () => setIsDropdownOpen((prev) => !prev),
  });

  useKeyboardShortcut({
    key: "v",
    altKey: true,
    handler: () => setIsCaptureModalOpen(true),
  });

  useKeyboardShortcut({
    key: "s",
    shiftKey: true,
    altKey: true,
    handler: () => setIsStreamAutomationModalOpen(true),
  });

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsModalOpen(true);
    window.addEventListener("openSettings", handleOpenSettings);
    return () => window.removeEventListener("openSettings", handleOpenSettings);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData?.user) return;
        setUser({
          name:
            userData.user.user_metadata?.name || userData.user.email || "User",
          email: userData.user.email || "",
          avatar:
            userData.user.user_metadata?.avatar_url || "/avatars/user.jpg",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const navItemsWithActiveState = navItems.map((item) => {
    const isActive = item.url
      ? activePath === item.url || activePath.startsWith(`${item.url}/`)
      : false;
    return { ...item, isActive };
  });


  return (
    <>
      <Sidebar
        collapsible="icon"
        variant="sidebar"
        className="group [&_[data-slot=sidebar-content]]:scrollbar-hide border-r border-white/10"
        {...props}
      >
        <SidebarHeader
          className={cn(
            "border-b-0",
            state === "expanded" ? "p-6" : "p-3 flex justify-center",
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 group/logo",
              state === "collapsed" && "justify-center",
            )}
          >
            {/* Gradient Logo */}
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 group-hover/logo:shadow-blue-500/30 transition-shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span
              className={cn(
                "text-xl font-bold text-white tracking-tight",
                state === "collapsed" && "hidden",
              )}
            >
              Slipstream
            </span>
          </Link>
        </SidebarHeader>

        {/* New Button - Separated with bottom spacing */}
        <div
          className={cn(
            "mb-6",
            state === "expanded" ? "px-4" : "px-0 flex justify-center",
          )}
        >
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              {state === "expanded" ? (
                <div className="relative group/new w-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl blur opacity-40 group-hover/new:opacity-60 transition-opacity duration-300" />
                  <button
                    ref={dropdownTriggerRef}
                    className="relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New</span>
                  </button>
                </div>
              ) : (
                <button
                  ref={dropdownTriggerRef}
                  className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-400 transition-colors duration-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side={state === "expanded" ? "bottom" : "right"} 
              align="start" 
              className="w-56 glass-strong border-white/10"
            >
              <DropdownMenuItem
                onClick={() => setIsCaptureModalOpen(true)}
                className="cursor-pointer py-2 text-sm"
              >
                <LinkIcon className="mr-2 h-4 w-4 text-violet-400" />
                <span>Video Scan</span>
                <span className="ml-auto text-xs text-gray-500">Alt+V</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.location.href = "/streams/new"}
                className="cursor-pointer py-2 text-sm"
              >
                <WifiCog className="mr-2 h-4 w-4 text-blue-400" />
                <span>New Stream</span>
                <span className="ml-auto text-xs text-gray-500">Alt+Shift+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.location.href = "/reports/new"}
                className="cursor-pointer py-2 text-sm"
              >
                <FileText className="mr-2 h-4 w-4 text-emerald-400" />
                <span>Generate Report</span>
                <span className="ml-auto text-xs text-gray-500"></span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />

        {/* Scrollable Content Area */}
        <SidebarContent className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
          <NavMain items={navItemsWithActiveState} />

          {/* Divider between nav items and collections */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

          <NavCollections
            pinnedCollections={pinnedCollections}
            recentCollections={recentCollections}
            onPin={handlePinWithLimit}
            onUnpin={handleUnpin}
            onReorder={handleReorderPinned}
            syncingCollectionId={syncingCollectionId}
          />
        </SidebarContent>

        {/* Fixed Footer */}
        <SidebarFooter
          className={cn(
            "mt-auto border-t border-white/5 relative z-10 bg-transparent",
            state === "expanded" ? "p-4" : "p-2",
          )}
        >
          <NavUser user={user} />
        </SidebarFooter>

        <CustomSidebarTrigger />

        <CaptureModal
          open={isCaptureModalOpen}
          onOpenChange={setIsCaptureModalOpen}
        />
        <RadarModal
          open={isStreamAutomationModalOpen}
          onOpenChange={setIsStreamAutomationModalOpen}
        />
        <SettingsModal
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
        />
      </Sidebar>

      <PinLimitDialog
        open={isPinLimitDialogOpen}
        onOpenChange={setIsPinLimitDialogOpen}
        pinnedCollections={pinnedCollections}
        onReplace={handleReplaceFromDialog}
        newCollectionId={pendingCollectionId}
      />
    </>
  );
}
