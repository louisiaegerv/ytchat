"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLoading } from "@/components/LoadingProvider";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    onClick?: () => void;
    shortcut?: string;
    items?: {
      title: string;
      url: string;
    }[];
    dropdown?: {
      options: {
        label: string;
        icon: LucideIcon;
        onClick: () => void;
        shortcut: string;
      }[];
      isOpen?: boolean;
      onOpenChange?: (open: boolean) => void;
      triggerRef?: React.RefObject<HTMLButtonElement | null>;
    };
  }[];
}) {
  const { state } = useSidebar();
  const { startLoading } = useLoading();
  const isExpanded = state === "expanded";

  const handleNavClick = (url?: string) => {
    if (url) {
      startLoading(url);
    }
  };

  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarMenu className="gap-0">
        {items.map((item) =>
          item.dropdown ? (
            <SidebarMenuItem key={item.title}>
              <DropdownMenu
                open={item.dropdown.isOpen}
                onOpenChange={item.dropdown.onOpenChange}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    ref={item.dropdown.triggerRef}
                    className={cn(
                      "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 sidebar-nav-item",
                      isExpanded ? "px-4" : "px-0 justify-center",
                      item.isActive
                        ? "active text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          item.isActive ? "text-blue-400" : "",
                        )}
                      />
                    )}
                    <span className={cn("flex-1 text-left", !isExpanded && "hidden")}>
                      {item.title}
                    </span>
                    {item.shortcut && (
                      <KbdGroup className={cn("ml-auto", !isExpanded && "hidden")}>
                        <Kbd>{item.shortcut}</Kbd>
                      </KbdGroup>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-56 glass-strong border-white/10"
                >
                  {item.dropdown.options.map((option) => (
                    <DropdownMenuItem
                      key={option.label}
                      onClick={option.onClick}
                      className="cursor-pointer py-2 text-sm"
                    >
                      <option.icon className="mr-2 h-4 w-4" />
                      <span>{option.label}</span>
                      <KbdGroup className="ml-auto">
                        <Kbd>{option.shortcut}</Kbd>
                      </KbdGroup>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 sidebar-nav-item",
                      isExpanded ? "px-4" : "px-0 justify-center",
                      item.isActive
                        ? "active text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          item.isActive ? "text-blue-400" : "",
                        )}
                      />
                    )}
                    <span className={cn("flex-1 text-left", !isExpanded && "hidden")}>
                      {item.title}
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-4 border-l border-white/10 pl-3 pr-0 mt-1 space-y-0.5">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <a
                          href={subItem.url}
                          onClick={() => handleNavClick(subItem.url)}
                          className="h-8 rounded-md text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center px-2"
                        >
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden sidebar-nav-item",
                    isExpanded ? "px-4 text-left" : "px-0 justify-center",
                    item.isActive
                      ? "active text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  {item.isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent pointer-events-none" />
                  )}
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "relative z-10 w-5 h-5 flex-shrink-0",
                        item.isActive ? "text-blue-400" : "",
                      )}
                    />
                  )}
                  <span className={cn("relative z-10 flex-1", !isExpanded && "hidden")}>
                    {item.title}
                  </span>
                  {item.shortcut && (
                    <KbdGroup className={cn("relative z-10 ml-auto", !isExpanded && "hidden")}>
                      <Kbd>{item.shortcut}</Kbd>
                    </KbdGroup>
                  )}
                </button>
              ) : (
                <Link
                  href={item.url || "#"}
                  onClick={() => handleNavClick(item.url)}
                  className={cn(
                    "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden sidebar-nav-item",
                    isExpanded ? "px-4" : "px-0 justify-center",
                    item.isActive
                      ? "active text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5",
                  )}
                >
                  {item.isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent pointer-events-none" />
                  )}
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "relative z-10 w-5 h-5 flex-shrink-0",
                        item.isActive ? "text-blue-400" : "",
                      )}
                    />
                  )}
                  <span className={cn("relative z-10 flex-1", !isExpanded && "hidden")}>
                    {item.title}
                  </span>
                  {item.shortcut && (
                    <KbdGroup className={cn("ml-auto", !isExpanded && "hidden")}>
                      <Kbd>{item.shortcut}</Kbd>
                    </KbdGroup>
                  )}
                </Link>
              )}
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
