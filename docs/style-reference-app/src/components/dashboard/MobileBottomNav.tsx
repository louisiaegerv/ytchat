// Mobile bottom navigation component
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Bot,
  Search,
  BarChart3,
  Plus
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFabClick: () => void;
}

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'automations', icon: Bot, label: 'Auto' },
  { id: 'fab', icon: Plus, label: '', isFab: true },
  { id: 'discover', icon: Search, label: 'Find' },
  { id: 'analytics', icon: BarChart3, label: 'Stats' },
];

export function MobileBottomNav({ activeTab, onTabChange, onFabClick }: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-pb md:hidden">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          if (item.isFab) {
            return (
              <div key={item.id} className="relative -top-5">
                <Button
                  onClick={onFabClick}
                  size="icon"
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white shadow-lg shadow-blue-500/25 border-4 border-background"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative',
                isActive && 'after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all duration-200',
                isActive && 'text-primary'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
