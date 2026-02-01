"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import * as React from "react";
import {
  Home,
  BookOpen,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
    icon: Home,
    shortcut: "",
  },
  {
    title: "Videos",
    url: "/videos",
    icon: BookOpen,
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
        // Panel-edge positioning: straddle the border between sidebar and main content
        "absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1/2",
        // Ghost button styling - invisible by default, visible on hover
        "opacity-0 group-hover:opacity-100",
        // Button styling
        "flex h-8 w-8 items-center justify-center rounded-full",
        "bg-sidebar border border-sidebar-border shadow-lg",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
        "transition-all duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
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
    return button;
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
  const pathname = usePathname();
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
      ? pathname === item.url || pathname.startsWith(`${item.url}/`)
      : false;
    return { ...item, isActive };
  });

  const navItemsWithNew = [
    {
      title: "New",
      icon: Plus,
      shortcut: "",
      dropdown: {
        options: [
          {
            label: "Video Scan",
            icon: LinkIcon,
            onClick: () => setIsCaptureModalOpen(true),
            shortcut: "Alt+V",
          },
          {
            label: "New Stream",
            icon: WifiCog,
            onClick: () => (window.location.href = "/streams/new"),
            shortcut: "Alt+Shift+S",
          },
        ],
        isOpen: isDropdownOpen,
        onOpenChange: setIsDropdownOpen,
        triggerRef: dropdownTriggerRef,
      },
    },
    ...navItemsWithActiveState,
  ];

  return (
    <>
      <Sidebar collapsible="icon" variant="inset" className="group" {...props}>
        <SidebarHeader className="border-b border-sidebar-border/50">
          <div className="flex items-center gap-2 px-2">
            <SidebarMenu>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  {/* Gradient Logo */}
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg logo-gradient shadow-lg shadow-blue-500/20">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-lg text-white">
                      Slipstream
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <NavMain items={navItemsWithNew} />
          <NavCollections
            pinnedCollections={pinnedCollections}
            recentCollections={recentCollections}
            onPin={handlePinWithLimit}
            onUnpin={handleUnpin}
            onReorder={handleReorderPinned}
            syncingCollectionId={syncingCollectionId}
          />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/50">
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
