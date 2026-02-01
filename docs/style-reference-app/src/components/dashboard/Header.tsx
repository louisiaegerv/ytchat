import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Plus,
  Settings,
  ChevronDown,
  Sparkles,
  Command,
  Menu,
  Bot,
  CheckCircle,
  FileText,
  Zap
} from 'lucide-react';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuClick?: () => void;
}

export function Header({ sidebarCollapsed, onMenuClick }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header 
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300',
        'left-0 md:left-16',
        !sidebarCollapsed && 'md:left-64'
      )}
    >
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left Section - Logo (mobile) + Search */}
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile Menu Button / Logo */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div 
              className={cn(
                'relative group transition-all duration-300',
                searchFocused && 'ring-2 ring-primary/50 rounded-lg'
              )}
            >
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                searchFocused ? 'text-primary' : 'text-muted-foreground'
              )} />
              <Input
                placeholder="Search videos, channels, insights..."
                className="pl-10 pr-8 h-10 bg-secondary/50 border-border/50 focus:bg-secondary transition-all duration-200 text-sm md:text-base"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                <kbd className="h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground hidden lg:inline-flex">
                  <Command className="w-3 h-3" />
                  K
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 ml-4">
          {/* Quick Actions - Desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex items-center gap-2 border-border/50 hover:bg-secondary"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Quick Action</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Start Something New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Bot className="w-4 h-4" />
                New Automation
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Search className="w-4 h-4" />
                Discover Videos
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-secondary h-9 w-9 md:h-10 md:w-10"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 md:w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge variant="secondary" className="text-xs">3 new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">New AI Insight Available</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Trend analysis completed for your automation</p>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Automation Completed</span>
                  </div>
                  <p className="text-xs text-muted-foreground">47 videos processed successfully</p>
                  <span className="text-xs text-muted-foreground">15 min ago</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Weekly Report Ready</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Your weekly analytics report is available</p>
                  <span className="text-xs text-muted-foreground">1 hour ago</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings - Desktop only */}
          <Button 
            variant="ghost" 
            size="icon"
            className="hidden md:flex hover:bg-secondary h-10 w-10"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* User Avatar - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden md:flex h-10 w-10 p-0 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-border">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>John Doe</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">john@example.com</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
