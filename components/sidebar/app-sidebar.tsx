"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Command,
  GalleryVerticalEnd,
  Plus,
  Link as LinkIcon,
  WifiCog,
  Wind,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { CaptureModal } from "@/components/capture-modal";
import { RadarModal } from "@/components/radar-modal";
import { SettingsModal } from "@/components/settings-modal";
import { NavCollections } from "@/components/nav-collections";
import PinLimitDialog from "@/components/library/PinLimitDialog";
import { usePinnedCollections } from "@/components/PinnedCollectionsContext";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarTrigger,
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

// Slipstream sidebar data
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "New",
      icon: Plus,
      shortcut: "Alt+N",
    },
    {
      title: "Library",
      url: "/library",
      icon: BookOpen,
      shortcut: "Alt+L",
    },
    {
      title: "Stream Hub",
      url: "/stream-hub",
      icon: Boxes,
      shortcut: "Alt+H",
    },
  ],
};

// Export a lightweight copy of the sidebar data (titles + urls only) for reuse (e.g., breadcrumbs).
// This avoids importing icon components or React elements in consumers.
export const __sidebarData__ = {
  navMain: data.navMain.map((item) => ({
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
        "flex h-8 w-8 items-center justify-center rounded-md",
        "bg-sidebar border border-sidebar-border shadow-sm",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "transition-all duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        "focus-visible:opacity-100", // Show when focused for accessibility
        // Cursor changes based on state to indicate direction
        // state === "expanded" ? "cursor-w-resize" : "cursor-e-resize",
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

  // Don't show tooltip on mobile
  if (isMobile) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="left" align="center">
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

  // Use pinned collections hook
  const {
    pinnedCollections,
    recentCollections,
    handlePin,
    handleUnpin,
    handleReplace,
    handleReorder,
    syncingCollectionId,
  } = usePinnedCollections();

  // Handler for pin with limit check
  const handlePinWithLimit = async (collectionId: string) => {
    try {
      await handlePin(collectionId);
    } catch (error: any) {
      if (error.message === "PIN_LIMIT_REACHED") {
        setPendingCollectionId(collectionId);
        setIsPinLimitDialogOpen(true);
      } else {
        console.error("Error pinning collection:", error);
      }
    }
  };

  // Handler for replace from dialog
  const handleReplaceFromDialog = async (
    oldCollectionId: string,
    newCollectionId: string,
  ) => {
    await handleReplace(oldCollectionId, newCollectionId);
    setIsPinLimitDialogOpen(false);
    setPendingCollectionId(null);
  };

  // Keyboard shortcut to open New dropdown (Alt+N)
  useKeyboardShortcut({
    key: "n",
    altKey: true,
    handler: () => {
      setIsDropdownOpen((prev) => !prev);
    },
  });

  // Keyboard shortcut to open Capture modal directly (Alt+C)
  useKeyboardShortcut({
    key: "v",
    altKey: true,
    handler: () => setIsCaptureModalOpen(true),
  });

  // Keyboard shortcut to open Radar modal (Alt+S)
  useKeyboardShortcut({
    key: "s",
    altKey: true,
    handler: () => setIsStreamAutomationModalOpen(true),
  });

  // Handle openSettings event from CaptureModal
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

        if (error || !userData?.user) {
          console.error("Error fetching user:", error);
          return;
        }

        const supabaseUser = userData.user;
        setUser({
          name:
            supabaseUser.user_metadata?.name || supabaseUser.email || "User",
          email: supabaseUser.email || "",
          avatar: supabaseUser.user_metadata?.avatar_url || "/avatars/user.jpg",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Dynamically compute active state based on current pathname
  const navMainWithActiveState = data.navMain.map((item) => {
    if (item.title === "New") {
      return {
        ...item,
        dropdown: {
          options: [
            {
              label: "Video Scan",
              icon: LinkIcon,
              onClick: () => setIsCaptureModalOpen(true),
              shortcut: "Alt+V",
            },
            {
              label: "Stream Automation",
              icon: WifiCog,
              onClick: () => setIsStreamAutomationModalOpen(true),
              shortcut: "Alt+S",
            },
          ],
          isOpen: isDropdownOpen,
          onOpenChange: setIsDropdownOpen,
          triggerRef: dropdownTriggerRef,
        },
      };
    }
    return {
      ...item,
      isActive: pathname === item.url,
    };
  });

  return (
    <>
      <Sidebar collapsible="icon" variant="inset" {...props}>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarMenu>
              {/* App Home Button */}
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Wind />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Slipstream</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>
          </div>
          {/* <TeamSwitcher teams={data.teams} /> */}
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMainWithActiveState} />
          <NavCollections
            pinnedCollections={pinnedCollections}
            recentCollections={recentCollections}
            onPin={handlePinWithLimit}
            onUnpin={handleUnpin}
            onReorder={handleReorder}
            syncingCollectionId={syncingCollectionId}
          />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        {/* Custom panel-edge trigger with chevron icons */}
        <CustomSidebarTrigger />
        {/* <SidebarRail /> */}
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
        {/* Settings Modal */}
        <SettingsModal
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
        />
      </Sidebar>
      {/* Pin Limit Dialog */}
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
