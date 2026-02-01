import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Video,
  FileText,
  Bot,
  Sparkles,
  ChevronRight,
  Clock,
  Activity as ActivityIcon
} from 'lucide-react';
import { recentActivity, type Activity } from '@/data/mockData';

const activityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  video_processed: {
    icon: Video,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  report_generated: {
    icon: FileText,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10'
  },
  automation_created: {
    icon: Bot,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  },
  insight_found: {
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  }
};

function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white text-sm group-hover:text-primary transition-colors">
            {activity.title}
          </h4>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {activity.timestamp}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {activity.description}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <ActivityIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Latest actions and updates</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-background">
            Live
            <span className="w-2 h-2 bg-emerald-500 rounded-full ml-2 animate-pulse" />
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-1">
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </ScrollArea>

        <Button 
          variant="ghost" 
          className="w-full mt-4 hover:bg-secondary gap-2 text-muted-foreground"
        >
          View Full Activity Log
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
