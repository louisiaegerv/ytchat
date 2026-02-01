import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Youtube,
  TrendingUp,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { topChannels } from '@/data/mockData';

export function TopChannels() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Youtube className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Top Channels</CardTitle>
              <p className="text-sm text-muted-foreground">Most engaged channels</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs hover:bg-secondary gap-1">
            View All
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {topChannels.map((channel, index) => (
              <div 
                key={channel.name}
                className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all cursor-pointer"
              >
                {/* Rank */}
                <div className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                  index === 0 && 'bg-yellow-500/20 text-yellow-400',
                  index === 1 && 'bg-gray-400/20 text-gray-300',
                  index === 2 && 'bg-amber-600/20 text-amber-500',
                  index > 2 && 'text-muted-foreground'
                )}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarFallback className={cn(
                    'text-sm font-medium',
                    index === 0 && 'bg-yellow-500/20 text-yellow-400',
                    index === 1 && 'bg-gray-400/20 text-gray-300',
                    index === 2 && 'bg-amber-600/20 text-amber-500',
                    index > 2 && 'bg-secondary text-muted-foreground'
                  )}>
                    {channel.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Channel Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white text-sm truncate group-hover:text-primary transition-colors">
                      {channel.name}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {channel.videos} videos
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {channel.engagement} views
                    </span>
                  </div>
                </div>

                {/* Growth */}
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-emerald-500/10 text-emerald-400"
                  >
                    {channel.growth}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
