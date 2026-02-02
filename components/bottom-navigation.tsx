"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Video,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Link as LinkIcon,
  WifiCog,
  FileText,
  Settings,
  X,
  ArrowRight,
  Zap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { CaptureModal } from "@/components/capture-modal";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  onClick: () => void;
}

/**
 * Mobile-First Bottom Navigation for Dashboard Architecture
 *
 * Tabs: Home (Dashboard), Library, FAB (Add), Streams, More
 */
export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Check if a route is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  // Handle Video Scan option click
  const handleVideoScanClick = () => {
    setSelectedAction("scan");
    setTimeout(() => {
      setIsFabOpen(false);
      setSelectedAction(null);
      setIsCaptureModalOpen(true);
    }, 150);
  };

  // Handle New Stream option click
  const handleNewStreamClick = () => {
    setSelectedAction("stream");
    setTimeout(() => {
      setIsFabOpen(false);
      setSelectedAction(null);
      router.push("/streams/new");
    }, 150);
  };

  // Handle Generate Report option click
  const handleGenerateReportClick = () => {
    setSelectedAction("report");
    setTimeout(() => {
      setIsFabOpen(false);
      setSelectedAction(null);
      router.push("/reports/new");
    }, 150);
  };

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "stream",
      title: "New Stream",
      description: "Auto-collect videos by keyword",
      icon: WifiCog,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      onClick: handleNewStreamClick,
    },
    {
      id: "scan",
      title: "Video Scan",
      description: "Add a single YouTube video",
      icon: LinkIcon,
      bgColor: "bg-violet-500/10",
      iconColor: "text-violet-400",
      onClick: handleVideoScanClick,
    },
    {
      id: "report",
      title: "Generate Report",
      description: "Create AI-powered analysis",
      icon: FileText,
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      onClick: handleGenerateReportClick,
    },
  ];

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border md:hidden"
        style={{
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Home / Dashboard */}
          <Link href="/dashboard">
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive("/dashboard")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "relative",
                  isActive("/dashboard") &&
                    "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
                )}
              >
                <LayoutDashboard
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive("/dashboard") && "scale-110",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive("/dashboard") && "text-primary",
                )}
              >
                Home
              </span>
            </button>
          </Link>

          {/* Library */}
          <Link href="/videos">
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive("/videos")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "relative",
                  isActive("/videos") &&
                    "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
                )}
              >
                <Video
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive("/videos") && "scale-110",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive("/videos") && "text-primary",
                )}
              >
                Library
              </span>
            </button>
          </Link>

          {/* FAB (Floating Action Button) */}
          <div className="relative -top-5">
            <Button
              variant="default"
              size="icon"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white shadow-lg shadow-blue-500/25 border-4 border-background"
              aria-label="Add new"
              onClick={() => setIsFabOpen(true)}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>

          {/* Streams */}
          <Link href="/streams">
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive("/streams")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "relative",
                  isActive("/streams") &&
                    "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
                )}
              >
                <RefreshCw
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive("/streams") && "scale-110",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive("/streams") && "text-primary",
                )}
              >
                Streams
              </span>
            </button>
          </Link>

          {/* More */}
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
              isActive("/reports") || isActive("/settings")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setIsMoreOpen(true)}
          >
            <div
              className={cn(
                "relative",
                (isActive("/reports") || isActive("/settings")) &&
                  "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
              )}
            >
              <MoreHorizontal
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  (isActive("/reports") || isActive("/settings")) &&
                    "scale-110",
                )}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-all duration-200",
                (isActive("/reports") || isActive("/settings")) &&
                  "text-primary",
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* FAB Bottom Sheet (Quick Actions) */}
      {isFabOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200 md:hidden"
            onClick={() => setIsFabOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/50 animate-in slide-in-from-bottom duration-300 md:hidden">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-border" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Quick Actions</h3>
                    <p className="text-sm text-muted-foreground">
                      What would you like to do?
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setIsFabOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedAction === action.id;

                  return (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className={cn(
                        "w-full group p-4 rounded-xl border transition-all duration-300 text-left",
                        isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50 bg-secondary/30 active:scale-[0.98]",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                            action.bgColor,
                            isSelected && "scale-110",
                          )}
                        >
                          <Icon className={cn("w-6 h-6", action.iconColor)} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">
                            {action.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-all duration-300",
                            isSelected && "text-primary translate-x-1",
                          )}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Safe area padding */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </>
      )}

      {/* More Bottom Sheet */}
      {isMoreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200 md:hidden"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/50 animate-in slide-in-from-bottom duration-300 md:hidden">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-border" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <MoreHorizontal className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">More Options</h3>
                    <p className="text-sm text-muted-foreground">
                      Additional features
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setIsMoreOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Items */}
              <div className="space-y-3">
                <Link href="/reports" onClick={() => setIsMoreOpen(false)}>
                  <button className="w-full group p-4 rounded-xl border border-border/50 bg-secondary/30 transition-all duration-300 text-left active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">Reports</h4>
                        <p className="text-sm text-muted-foreground">
                          View your AI reports
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </Link>

                <Link href="/settings" onClick={() => setIsMoreOpen(false)}>
                  <button className="w-full group p-4 rounded-xl border border-border/50 bg-secondary/30 transition-all duration-300 text-left active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center flex-shrink-0">
                        <Settings className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">Settings</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage your preferences
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </Link>
              </div>
            </div>

            {/* Safe area padding */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </>
      )}

      {/* Capture Modal */}
      <CaptureModal
        open={isCaptureModalOpen}
        onOpenChange={setIsCaptureModalOpen}
      />
    </>
  );
}
