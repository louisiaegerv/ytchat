"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) =>
          item.dropdown ? (
            <SidebarMenuItem key={item.title}>
              <DropdownMenu
                open={item.dropdown.isOpen}
                onOpenChange={item.dropdown.onOpenChange}
              >
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    ref={item.dropdown.triggerRef}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.shortcut && (
                      <KbdGroup className="ml-auto">
                        <Kbd>{item.shortcut}</Kbd>
                      </KbdGroup>
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-60"
                >
                  {item.dropdown.options.map((option) => (
                    <DropdownMenuItem
                      key={option.label}
                      onClick={option.onClick}
                      className="cursor-pointer"
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
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              {item.onClick ? (
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={item.isActive}
                  onClick={item.onClick}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.shortcut && (
                    <KbdGroup className="ml-auto">
                      <Kbd>{item.shortcut}</Kbd>
                    </KbdGroup>
                  )}
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={item.isActive}
                >
                  <a href={item.url} className="flex items-center gap-2 w-full">
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
