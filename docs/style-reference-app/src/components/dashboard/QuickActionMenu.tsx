import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bot,
  Video,
  FileText,
  Sparkles,
  X,
  ArrowRight,
  Zap
} from 'lucide-react';

interface QuickActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickActions = [
  {
    id: 'automation',
    title: 'New Automation',
    description: 'Create an automated workflow to collect and analyze videos',
    icon: Bot,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    id: 'scan',
    title: 'Scan Video',
    description: 'Manually enter a YouTube URL for instant analysis',
    icon: Video,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
  },
  {
    id: 'report',
    title: 'Generate Report',
    description: 'Create a comprehensive AI-powered analysis report',
    icon: FileText,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
];

export function QuickActionMenu({ open, onOpenChange }: QuickActionMenuProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">Quick Actions</DialogTitle>
                <p className="text-sm text-muted-foreground">What would you like to do?</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isSelected = selectedAction === action.id;

            return (
              <button
                key={action.id}
                onClick={() => setSelectedAction(action.id)}
                className={cn(
                  'w-full group relative p-4 rounded-xl border transition-all duration-300 text-left',
                  isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-border'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                    action.bgColor,
                    isSelected && 'scale-110'
                  )}>
                    <Icon className={cn('w-6 h-6', action.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white group-hover:text-primary transition-colors">
                        {action.title}
                      </h4>
                      <ArrowRight className={cn(
                        'w-4 h-4 text-muted-foreground transition-all duration-300',
                        isSelected && 'translate-x-1 text-primary'
                      )} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>

                {/* Gradient overlay on hover */}
                <div className={cn(
                  'absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 transition-opacity duration-300 pointer-events-none',
                  action.color,
                  isSelected && 'opacity-5'
                )} />
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-2 border-t border-border/50 bg-secondary/20">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-border/50 hover:bg-secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white gap-2"
              disabled={!selectedAction}
            >
              <Sparkles className="w-4 h-4" />
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mobile version with bottom sheet style
export function MobileQuickActionSheet({ open, onOpenChange }: QuickActionMenuProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200 md:hidden"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/50 animate-in slide-in-from-bottom duration-300 md:hidden">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-border" />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">What would you like to do?</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;

              return (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={cn(
                    'w-full group p-4 rounded-xl border transition-all duration-300 text-left',
                    isSelected
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 bg-secondary/30 active:scale-[0.98]'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      action.bgColor
                    )}>
                      <Icon className={cn('w-6 h-6', action.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className={cn(
                      'w-5 h-5 text-muted-foreground transition-all',
                      isSelected && 'text-primary translate-x-1'
                    )} />
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white h-12"
            disabled={!selectedAction}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>

        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
