import { useState } from "react";
import {
  LayoutDashboard,
  PlaySquare,
  FolderOpen,
  Radio,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Pin,
  Clock,
  MoreVertical,
  ExternalLink,
  Copy,
  MessageSquare,
  FolderPlus,
  Zap,
  Eye,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Navigation items
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false },
  { icon: PlaySquare, label: "Videos", active: true },
  { icon: FolderOpen, label: "Collections", active: false },
  { icon: Radio, label: "Streams", active: false },
  { icon: FileText, label: "Reports", active: false },
];

const collections = {
  pinned: [{ name: "AI Stuff", icon: Pin, color: "text-blue-400" }],
  recent: [
    { name: "News", icon: Clock, color: "text-gray-400" },
    { name: "Future Reference", icon: Clock, color: "text-gray-400" },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState("summary");
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pinned: true,
    recent: true,
  });

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: "pinned" | "recent") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="flex relative z-10">
        {/* Glassmorphism Sidebar */}
        <aside className="w-64 h-screen glass-strong fixed left-0 top-0 flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Slipstream</span>
          </div>

          {/* New Button */}
          <div className="px-4 mb-6">
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-5 rounded-lg btn-glow animate-pulse-glow">
              <Plus className="w-5 h-5 mr-2" />
              New
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`nav-glow w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  item.active
                    ? "active text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${item.active ? "text-blue-400" : ""}`}
                />
                {item.label}
              </button>
            ))}

            {/* Collections Section */}
            <div className="pt-6">
              <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Collections
              </div>

              {/* Pinned */}
              <div className="mb-2">
                <button
                  onClick={() => toggleSection("pinned")}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <span>Pinned</span>
                  {expandedSections.pinned ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.pinned && (
                  <div className="mt-1 space-y-1">
                    {collections.pinned.map((col) => (
                      <button
                        key={col.name}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                      >
                        <FolderOpen className={`w-4 h-4 ${col.color}`} />
                        {col.name}
                        <Pin className="w-3 h-3 ml-auto text-blue-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent */}
              <div>
                <button
                  onClick={() => toggleSection("recent")}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <span>Recent</span>
                  {expandedSections.recent ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.recent && (
                  <div className="mt-1 space-y-1">
                    {collections.recent.map((col) => (
                      <button
                        key={col.name}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                      >
                        <FolderOpen className={`w-4 h-4 ${col.color}`} />
                        {col.name}
                        <Clock className="w-3 h-3 ml-auto text-gray-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/5">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <span className="text-sm font-medium text-white">I</span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white truncate">
                  iaegercorp@gmail.com
                </div>
                <div className="text-xs text-gray-500">
                  iaegercorp@gmail.com
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Card - Glassmorphism */}
              <div className="glass rounded-3xl p-6 card-lift">
                {/* Video Thumbnail */}
                <div className="relative rounded-2xl overflow-hidden mb-6 group">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                    {/* Mock Thumbnail Content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl font-black text-white/10 mb-2">
                          We are here.
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                            <PlaySquare className="w-8 h-8 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Thumbnail Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Glow Effect on Hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20" />
                  </div>
                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded text-xs font-medium text-white">
                    4:45
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">
                        Is n8n Dead?
                      </h1>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="text-blue-400 font-medium">
                          Channel Name
                        </span>
                        <span>•</span>
                        <span>Published: 2/1/2026</span>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 line-clamp-2">
                    Full courses + unlimited support:
                    https://www.skool.com/ai-automation-society-plus/about All
                    my FREE resources:
                    https://www.skool.com/ai-automation-society/about
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3">
                    <div className="stat-pill px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">21,716</span>
                    </div>
                    <div className="stat-pill px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
                      <ThumbsUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">888</span>
                    </div>
                    <div className="stat-pill px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">175</span>
                    </div>
                  </div>

                  {/* Watch Link */}
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Watch on YouTube
                    <span className="text-gray-500">
                      (YouTube content © respective owners)
                    </span>
                  </a>
                </div>

                {/* Collections Section */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-gray-400" />
                      Collections
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 hover:bg-white/5 hover:border-blue-500/50 transition-all"
                    >
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Add to Collection
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    This video is not in any collections yet.
                  </p>
                </div>
              </div>

              {/* AI Summary Panel - Glassmorphism with Glow */}
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="glass rounded-3xl p-6 ai-glow-border">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        The END of NADN? Navigating the Shift Between Visual
                        Automation (NADN) and Cloud Code ☁️
                      </h2>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Summary Text */}
                  <div className="prose prose-invert prose-sm max-w-none mb-6">
                    <p className="text-gray-300 leading-relaxed">
                      This video addresses the recent online speculation about
                      whether the AI automation tool
                      <span className="text-blue-400 font-medium">
                        {" "}
                        NADN
                      </span>{" "}
                      is "dead" due to the rising popularity of{" "}
                      <span className="text-purple-400 font-medium">
                        Cloud Code
                      </span>
                      , concluding that while platform dominance is shifting,
                      NADN remains a relevant and vital tool, especially for
                      beginners.
                    </p>
                  </div>

                  {/* Key Points */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Key Points: The Changing Landscape of AI Tools
                    </h3>
                    <div className="space-y-2">
                      {[
                        "Platform shifts are natural in the AI automation space",
                        "NADN still offers value for visual workflow builders",
                        "Cloud Code appeals to developers and technical users",
                        "Beginners should start with visual tools before coding",
                      ].map((point, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-white">
                              {i + 1}
                            </span>
                          </div>
                          <span className="text-sm text-gray-300">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <Button
                    onClick={handleCopy}
                    className={`w-full py-5 rounded-xl font-medium transition-all duration-300 ${
                      copied
                        ? "bg-green-600 hover:bg-green-500 glow-primary"
                        : "bg-white/10 hover:bg-white/15 hover:border-blue-500/50 border border-white/10"
                    }`}
                  >
                    <Copy
                      className={`w-5 h-5 mr-2 ${copied ? "text-white" : "text-gray-400"}`}
                    />
                    {copied ? "Copied!" : "Copy Summary"}
                  </Button>
                </div>

                {/* Tabs */}
                <div className="glass rounded-2xl p-2">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-3 bg-transparent p-0 gap-1">
                      {[
                        { value: "transcript", label: "Raw Transcript" },
                        { value: "summary", label: "AI Summary" },
                        { value: "chat", label: "Chat" },
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className={`tab-glow py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                            activeTab === tab.value
                              ? "active bg-white/10 text-white"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="py-5 rounded-xl border-white/10 hover:bg-white/5 hover:border-purple-500/50 transition-all group"
                  >
                    <MessageSquare className="w-5 h-5 mr-2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                    <span className="text-gray-300 group-hover:text-white">
                      Ask AI
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="py-5 rounded-xl border-white/10 hover:bg-white/5 hover:border-blue-500/50 transition-all group"
                  >
                    <FolderPlus className="w-5 h-5 mr-2 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-gray-300 group-hover:text-white">
                      Save Note
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
