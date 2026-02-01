export interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  category: string;
}

export interface Automation {
  id: string;
  name: string;
  query: string;
  status: 'active' | 'paused' | 'error';
  lastRun: string;
  nextRun: string;
  videosFound: number;
  frequency: string;
}

export interface Activity {
  id: string;
  type: 'video_processed' | 'report_generated' | 'automation_created' | 'insight_found';
  title: string;
  description: string;
  timestamp: string;
}

export interface ChartData {
  name: string;
  value: number;
  value2?: number;
}

export const metricsData: MetricCard[] = [
  {
    title: 'Videos Analyzed',
    value: '12,847',
    change: '+23.5%',
    trend: 'up',
    icon: 'Video'
  },
  {
    title: 'Active Automations',
    value: '24',
    change: '+4',
    trend: 'up',
    icon: 'Bot'
  },
  {
    title: 'AI Insights Generated',
    value: '1,432',
    change: '+18.2%',
    trend: 'up',
    icon: 'Brain'
  },
  {
    title: 'Reports Created',
    value: '89',
    change: '+12',
    trend: 'up',
    icon: 'FileText'
  }
];

export const aiInsights: AIInsight[] = [
  {
    id: '1',
    type: 'trend',
    title: 'Rising Interest in AI Tutorials',
    description: 'Videos containing "AI tutorial" or "machine learning" keywords have seen a 340% increase in engagement over the past 30 days across monitored channels.',
    confidence: 94,
    timestamp: '2 hours ago',
    category: 'Technology'
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Underserved Niche Detected',
    description: 'Low competition detected for "sustainable tech reviews" with high viewer retention potential. Consider creating content in this space.',
    confidence: 87,
    timestamp: '4 hours ago',
    category: 'Market Analysis'
  },
  {
    id: '3',
    type: 'anomaly',
    title: 'Unusual Engagement Spike',
    description: 'Channel "TechDaily" experienced 5x normal engagement on their latest video. Analyzing factors for potential replication.',
    confidence: 91,
    timestamp: '6 hours ago',
    category: 'Engagement'
  },
  {
    id: '4',
    type: 'warning',
    title: 'Sentiment Shift Detected',
    description: 'Negative sentiment increasing around "crypto" topics in your monitored channels. Consider adjusting content strategy.',
    confidence: 82,
    timestamp: '8 hours ago',
    category: 'Sentiment'
  },
  {
    id: '5',
    type: 'trend',
    title: 'Short-Form Content Dominance',
    description: 'Videos under 60 seconds are receiving 2.3x more comments and shares compared to longer formats in your niche.',
    confidence: 89,
    timestamp: '12 hours ago',
    category: 'Content Strategy'
  }
];

export const automations: Automation[] = [
  {
    id: '1',
    name: 'AI & Machine Learning',
    query: 'AI tutorial, machine learning, deep learning, neural networks',
    status: 'active',
    lastRun: '15 min ago',
    nextRun: 'in 45 min',
    videosFound: 1247,
    frequency: 'Every hour'
  },
  {
    id: '2',
    name: 'Tech Reviews',
    query: 'tech review, gadget review, smartphone review, laptop review',
    status: 'active',
    lastRun: '32 min ago',
    nextRun: 'in 28 min',
    videosFound: 892,
    frequency: 'Every hour'
  },
  {
    id: '3',
    name: 'Programming Tutorials',
    query: 'programming tutorial, coding, javascript, python, react',
    status: 'active',
    lastRun: '1 hour ago',
    nextRun: 'in 2 hours',
    videosFound: 2156,
    frequency: 'Every 3 hours'
  },
  {
    id: '4',
    name: 'Startup News',
    query: 'startup news, venture capital, funding, entrepreneurship',
    status: 'paused',
    lastRun: '2 days ago',
    nextRun: 'Paused',
    videosFound: 423,
    frequency: 'Daily'
  },
  {
    id: '5',
    name: 'Crypto & Blockchain',
    query: 'cryptocurrency, bitcoin, ethereum, blockchain, defi',
    status: 'error',
    lastRun: '5 hours ago',
    nextRun: 'Retrying...',
    videosFound: 678,
    frequency: 'Every 2 hours'
  }
];

export const recentActivity: Activity[] = [
  {
    id: '1',
    type: 'insight_found',
    title: 'New AI Insight Generated',
    description: 'Trend analysis completed for "AI Tutorials" automation',
    timestamp: '5 min ago'
  },
  {
    id: '2',
    type: 'video_processed',
    title: '47 Videos Processed',
    description: 'From "Tech Reviews" automation batch',
    timestamp: '15 min ago'
  },
  {
    id: '3',
    type: 'report_generated',
    title: 'Weekly Report Ready',
    description: 'Comprehensive analysis of 847 videos across 5 automations',
    timestamp: '1 hour ago'
  },
  {
    id: '4',
    type: 'automation_created',
    title: 'New Automation Created',
    description: '"Sustainable Tech Reviews" automation is now active',
    timestamp: '3 hours ago'
  },
  {
    id: '5',
    type: 'video_processed',
    title: '123 Videos Processed',
    description: 'From "Programming Tutorials" automation batch',
    timestamp: '4 hours ago'
  },
  {
    id: '6',
    type: 'insight_found',
    title: 'Market Opportunity Detected',
    description: 'Underserved niche identified in sustainable technology',
    timestamp: '6 hours ago'
  }
];

export const weeklyData: ChartData[] = [
  { name: 'Mon', value: 420, value2: 380 },
  { name: 'Tue', value: 580, value2: 450 },
  { name: 'Wed', value: 490, value2: 520 },
  { name: 'Thu', value: 720, value2: 610 },
  { name: 'Fri', value: 650, value2: 580 },
  { name: 'Sat', value: 890, value2: 720 },
  { name: 'Sun', value: 760, value2: 680 }
];

export const categoryData: ChartData[] = [
  { name: 'Technology', value: 35 },
  { name: 'Education', value: 25 },
  { name: 'Entertainment', value: 20 },
  { name: 'Business', value: 12 },
  { name: 'Science', value: 8 }
];

export const sentimentData: ChartData[] = [
  { name: 'Positive', value: 62 },
  { name: 'Neutral', value: 28 },
  { name: 'Negative', value: 10 }
];

export const topChannels = [
  { name: 'TechDaily', videos: 234, engagement: '4.2M', growth: '+15%' },
  { name: 'CodeMaster', videos: 189, engagement: '2.8M', growth: '+22%' },
  { name: 'AI Insider', videos: 156, engagement: '1.9M', growth: '+34%' },
  { name: 'Startup Hub', videos: 134, engagement: '1.5M', growth: '+8%' },
  { name: 'DevOps Pro', videos: 112, engagement: '980K', growth: '+18%' }
];
