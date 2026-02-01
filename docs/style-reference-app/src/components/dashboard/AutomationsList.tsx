import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  MoreVertical,
  RefreshCw,
  Edit,
  Trash2,
  Clock,
  Video,
  Bot,
  Plus,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { automations, type Automation } from '@/data/mockData';

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  active: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: Play
  },
  paused: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: Pause
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: AlertCircle
  }
};

function AutomationCard({ automation }: { automation: Automation }) {
  const config = statusConfig[automation.status];

  return (
    <div className="group p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-border transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
            <Bot className={cn('w-5 h-5', config.color)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white truncate">{automation.name}</h4>
              <Badge 
                variant="secondary" 
                className={cn('text-xs capitalize', config.bgColor, config.color)}
              >
                {automation.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-md">
              {automation.query}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {automation.frequency}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Video className="w-3.5 h-3.5" />
                {automation.videosFound.toLocaleString()} videos
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5" />
                Last: {automation.lastRun}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
          >
            {automation.status === 'active' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Run Now
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-red-400">
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Bar for Active Automations */}
      {automation.status === 'active' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Next run</span>
            <span className="text-white">{automation.nextRun}</span>
          </div>
          <Progress value={65} className="h-1" />
        </div>
      )}
    </div>
  );
}

export function AutomationsList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'error'>('all');

  const filteredAutomations = filter === 'all' 
    ? automations 
    : automations.filter(a => a.status === filter);

  const activeCount = automations.filter(a => a.status === 'active').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;
  const errorCount = automations.filter(a => a.status === 'error').length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Active Automations</CardTitle>
              <p className="text-sm text-muted-foreground">{automations.length} automations running</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs gap-2"
          >
            All
            <Badge variant="secondary" className="text-xs bg-background">{automations.length}</Badge>
          </Button>
          <Button
            variant={filter === 'active' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('active')}
            className="text-xs gap-2"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            Active
            <Badge variant="secondary" className="text-xs bg-background text-emerald-400">{activeCount}</Badge>
          </Button>
          <Button
            variant={filter === 'paused' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('paused')}
            className="text-xs gap-2"
          >
            <Pause className="w-3 h-3 text-amber-400" />
            Paused
            <Badge variant="secondary" className="text-xs bg-background text-amber-400">{pausedCount}</Badge>
          </Button>
          <Button
            variant={filter === 'error' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('error')}
            className="text-xs gap-2"
          >
            <AlertCircle className="w-3 h-3 text-red-400" />
            Error
            <Badge variant="secondary" className="text-xs bg-background text-red-400">{errorCount}</Badge>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {filteredAutomations.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        </ScrollArea>

        <Button 
          variant="ghost" 
          className="w-full mt-4 hover:bg-secondary gap-2 text-muted-foreground"
        >
          View All Automations
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
