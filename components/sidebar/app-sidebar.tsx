"use client";

import Link from "next/link";
import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Wind,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Slipstream sidebar data
const data = {
  user: {
    name: "Slipstream User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  },
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
      title: "Explore Video",
      url: "/explore",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Library",
      url: "/library",
      icon: BookOpen,
      items: [
        {
          title: "All Videos",
          url: "/library",
        },
        {
          title: "Groups",
          url: "/library/groups",
        },
        {
          title: "Tags",
          url: "/library/tags",
        },
      ],
    },
    {
      title: "Multi-Video Summary",
      url: "/multi-summary",
      icon: Bot,
      items: [
        {
          title: "New Summary",
          url: "/multi-summary",
        },
        {
          title: "Past Summaries",
          url: "/multi-summary/history",
        },
      ],
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: PieChart,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Stats",
          url: "/dashboard/stats",
        },
        {
          title: "Trends",
          url: "/dashboard/trends",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "Profile",
          url: "/settings/profile",
        },
        {
          title: "Preferences",
          url: "/settings/preferences",
        },
        {
          title: "API Keys",
          url: "/settings/api-keys",
        },
      ],
    },
  ],
  projects: [],
};

// Export a lightweight copy of the sidebar data (titles + urls only) for reuse (e.g., breadcrumbs).
// This avoids importing icon components or React elements in consumers.
export const __sidebarData__ = {
  navMain: data.navMain.map((item) => ({
    title: item.title,
    url: item.url,
    items: item.items?.map((sub) => ({
      title: sub.title,
      url: sub.url,
    })),
  })),
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          {/* App Home Button */}
          <SidebarMenuButton size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Wind />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Slipstream</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenu>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
