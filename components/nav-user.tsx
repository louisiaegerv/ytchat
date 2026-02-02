"use client";

import * as React from "react";
import { signOutAction } from "@/app/actions";

import { ChevronDown, LogOut, Settings2, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SettingsModal } from "@/components/settings-modal";
import { cn } from "@/lib/utils";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile, state } = useSidebar();
  const isExpanded = state === "expanded";
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center rounded-xl transition-colors",
                  "hover:bg-white/5",
                  isExpanded ? "gap-3 p-3 text-left" : "justify-center p-2",
                )}
              >
                <Avatar className="h-10 w-10 rounded-full ring-2 ring-white/10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-full bg-gradient-to-br from-gray-600 to-gray-800 text-white font-medium">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex-1 text-left overflow-hidden", !isExpanded && "hidden")}>
                  <div className="text-sm font-medium text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-gray-500 flex-shrink-0", !isExpanded && "hidden")} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-xl glass-strong border-white/10"
              side={isMobile ? "bottom" : "top"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="flex items-center gap-3 px-1 py-1.5 text-left">
                  <Avatar className="h-10 w-10 rounded-full">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-full bg-gradient-to-br from-gray-600 to-gray-800 text-white font-medium">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="text-sm font-medium text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="py-2 cursor-pointer rounded-lg hover:bg-white/5 text-gray-300">
                  <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setSettingsOpen(true)}
                  className="py-2 cursor-pointer rounded-lg hover:bg-white/5 text-gray-300"
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-white/10" />
              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-red-500/10 text-gray-300 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
      />
    </>
  );
}
