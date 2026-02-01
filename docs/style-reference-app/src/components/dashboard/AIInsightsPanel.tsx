import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Filter,
  Brain
} from 'lucide-react';
import { aiInsights, type AIInsight } from '@/data/mockData';

type InsightType = 'all' | 'trend' | 'anomaly' | 'opportunity' | 'warning';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  trend: {
    icon: TrendingUp,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    label: 'Trend'
  },
  anomaly: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    label: 'Anomaly'
  },
  opportunity: {
    icon: Lightbulb,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    label: 'Opportunity'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    label: 'Warning'
  }
};

const filters: { value: InsightType; label: string }[] = [
  { value: 'all', label: 'All Insights' },
  { value: 'trend', label: 'Trends' },
  { value: 'opportunity', label: 'Opportunities' },
  { value: 'anomaly', label: 'Anomalies' },
  { value: 'warning', label: 'Warnings' }
];

function InsightCard({ insight }: { insight: AIInsight }) {
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <div className="group p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-border transition-all duration-200 cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={cn('text-xs', config.bgColor, config.color)}>
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{insight.timestamp}</span>
          </div>
          <h4 className="font-semibold text-white mt-2 group-hover:text-primary transition-colors">
            {insight.title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {insight.description}
          </p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">AI Confidence</span>
              <div className="w-16">
                <Progress value={insight.confidence} className="h-1.5" />
              </div>
              <span className="text-xs font-medium text-white">{insight.confidence}%</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIInsightsPanel() {
  const [activeFilter, setActiveFilter] = useState<InsightType>('all');

  const filteredInsights = activeFilter === 'all' 
    ? aiInsights 
    : aiInsights.filter(i => i.type === activeFilter);

  return (
    <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Insights</CardTitle>
              <p className="text-sm text-muted-foreground">Powered by advanced analysis</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-secondary">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4 overflow-auto pb-1 scrollbar-thin">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'text-xs whitespace-nowrap',
                activeFilter === filter.value && 'bg-secondary text-white'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </ScrollArea>

        <Button 
          variant="outline" 
          className="w-full mt-4 border-border/50 hover:bg-secondary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Insights
        </Button>
      </CardContent>
    </Card>
  );
}
