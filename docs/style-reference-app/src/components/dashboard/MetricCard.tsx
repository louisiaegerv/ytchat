import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Video, Bot, Brain, FileText } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  index: number;
}

const iconMap: Record<string, React.ElementType> = {
  Video,
  Bot,
  Brain,
  FileText
};

const gradientMap: Record<number, string> = {
  0: 'stat-card-gradient-1 glow-blue',
  1: 'stat-card-gradient-2 glow-purple',
  2: 'stat-card-gradient-3 glow-green',
  3: 'stat-card-gradient-4'
};

const iconColorMap: Record<number, string> = {
  0: 'text-blue-400',
  1: 'text-violet-400',
  2: 'text-emerald-400',
  3: 'text-amber-400'
};

const bgIconMap: Record<number, string> = {
  0: 'bg-blue-500/10',
  1: 'bg-violet-500/10',
  2: 'bg-emerald-500/10',
  3: 'bg-amber-500/10'
};

export function MetricCard({ title, value, change, trend, icon, index }: MetricCardProps) {
  const Icon = iconMap[icon] || Video;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <Card className={cn(
      'relative overflow-hidden p-6 border-border/50 transition-all duration-300 hover:scale-[1.02] hover:border-border',
      gradientMap[index]
    )}>
      {/* Background decoration */}
      <div className={cn(
        'absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-30',
        index === 0 && 'bg-blue-500',
        index === 1 && 'bg-violet-500',
        index === 2 && 'bg-emerald-500',
        index === 3 && 'bg-amber-500'
      )} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            bgIconMap[index]
          )}>
            <Icon className={cn('w-6 h-6', iconColorMap[index])} />
          </div>
          <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
            <TrendIcon className="w-4 h-4" />
            {change}
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}
