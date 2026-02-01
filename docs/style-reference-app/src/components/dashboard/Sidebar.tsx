import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Bot,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Zap,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  active?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '#', active: true },
  { icon: Bot, label: 'Automations', href: '#', badge: '24' },
  { icon: Search, label: 'Discover', href: '#' },
  { icon: FileText, label: 'Reports', href: '#', badge: '3' },
  { icon: BarChart3, label: 'Analytics', href: '#' },
];

const secondaryNavItems: NavItem[] = [
  { icon: Zap, label: 'Integrations', href: '#' },
  { icon: Settings, label: 'Settings', href: '#' },
  { icon: HelpCircle, label: 'Help & Support', href: '#' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('Dashboard');

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ease-in-out hidden md:block',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">Slipstream</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground hover:text-white hover:bg-sidebar-accent"
            onClick={onToggle}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-16 h-6 w-6 rounded-full bg-sidebar-background border border-sidebar-border text-sidebar-foreground hover:text-white"
          onClick={onToggle}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}

      <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
        <div className="p-3 space-y-6">
          {/* New Automation Button */}
          {!collapsed && (
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              New Automation
            </Button>
          )}
          {collapsed && (
            <Button 
              size="icon"
              className="w-10 h-10 mx-auto bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}

          {/* Main Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-2">
                Main
              </p>
            )}
            {mainNavItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeItem === item.label
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0', activeItem === item.label && 'text-blue-400')} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="bg-sidebar-primary/20 text-sidebar-primary text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Secondary Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-2">
                System
              </p>
            )}
            {secondaryNavItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white transition-all duration-200',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User Profile */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Doe</p>
              <p className="text-xs text-sidebar-foreground truncate">Pro Plan</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:text-white">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-sidebar-border bg-sidebar-background">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm mx-auto">
            JD
          </div>
        </div>
      )}
    </div>
  );
}
