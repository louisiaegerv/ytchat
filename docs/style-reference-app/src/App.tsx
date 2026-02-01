import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { QuickActionMenu, MobileQuickActionSheet } from '@/components/dashboard/QuickActionMenu';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { AutomationsList } from '@/components/dashboard/AutomationsList';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TopChannels } from '@/components/dashboard/TopChannels';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { metricsData } from '@/data/mockData';
import './App.css';

function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-purple-600/20 border border-border/50 p-4 md:p-6 mb-4 md:mb-6">
      {/* Background decorations */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 gap-1 text-xs">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">Updated 5 min ago</span>
          </div>
          <h1 className="text-lg md:text-2xl font-bold text-white mb-1">
            Welcome back, John! 👋
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl hidden sm:block">
            Your automations have processed <span className="text-white font-medium">1,247 videos</span> and generated 
            <span className="text-white font-medium"> 23 new insights</span> since your last visit. 
            Here's what's happening in your Slipstream.
          </p>
          <p className="text-sm text-muted-foreground sm:hidden">
            1,247 videos processed · 23 new insights
          </p>
          
          <div className="flex gap-2 md:gap-3 mt-3 md:mt-4">
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white gap-2 text-xs md:text-sm"
            >
              <Zap className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Quick Analysis</span>
              <span className="sm:hidden">Analyze</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border/50 hover:bg-secondary gap-2 text-xs md:text-sm"
            >
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">View Reports</span>
              <span className="sm:hidden">Reports</span>
            </Button>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-bold text-white">+34%</span>
            </div>
            <p className="text-sm text-muted-foreground">vs last week</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-right">
            <span className="text-2xl font-bold text-white">98.2%</span>
            <p className="text-sm text-muted-foreground">AI accuracy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('dashboard');
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop Sidebar - Hidden on mobile */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      {/* Header */}
      <Header 
        sidebarCollapsed={sidebarCollapsed} 
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Mobile Quick Action Sheet */}
      <MobileQuickActionSheet 
        open={quickActionOpen} 
        onOpenChange={setQuickActionOpen} 
      />
      
      {/* Desktop Quick Action Dialog */}
      <QuickActionMenu 
        open={quickActionOpen} 
        onOpenChange={setQuickActionOpen} 
      />
      
      {/* Main Content */}
      <main 
        className={cn(
          'pt-16 transition-all duration-300',
          'ml-0 md:ml-16',
          !sidebarCollapsed && 'md:ml-64'
        )}
      >
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          {/* Welcome Banner */}
          <WelcomeBanner />
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            {metricsData.map((metric, index) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                trend={metric.trend}
                icon={metric.icon}
                index={index}
              />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Analytics Charts - Takes up 2 columns */}
            <div className="xl:col-span-2">
              <AnalyticsCharts />
            </div>
            
            {/* AI Insights Panel */}
            <div className="xl:col-span-1">
              <AIInsightsPanel />
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Automations List */}
            <div className="lg:col-span-2">
              <AutomationsList />
            </div>
            
            {/* Right Column */}
            <div className="space-y-4 md:space-y-6">
              <ActivityFeed />
              <TopChannels />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={mobileActiveTab}
        onTabChange={setMobileActiveTab}
        onFabClick={() => setQuickActionOpen(true)}
      />
    </div>
  );
}

export default App;
