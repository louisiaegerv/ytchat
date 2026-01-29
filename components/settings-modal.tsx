"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Settings as SettingsIcon,
  Key,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Preferences as PreferencesComponent } from "@/components/settings/Preferences";

type SettingsTab =
  | "profile"
  | "account"
  | "billing"
  | "notifications"
  | "preferences"
  | "api-keys";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}

const navigationItems = [
  { id: "profile" as SettingsTab, label: "Profile", icon: User },
  { id: "account" as SettingsTab, label: "Account", icon: Shield },
  { id: "billing" as SettingsTab, label: "Billing", icon: CreditCard },
  { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
  {
    id: "preferences" as SettingsTab,
    label: "Preferences",
    icon: SettingsIcon,
  },
  { id: "api-keys" as SettingsTab, label: "API Keys", icon: Key },
];

export function SettingsModal({
  open,
  onOpenChange,
  user,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Custom overlay with blur effect - handled by Dialog component */}
        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-muted/30 flex flex-col">
            <div className="p-6 border-b">
              <DialogTitle className="text-xl font-semibold">
                Settings
              </DialogTitle>
              <DialogDescription className="text-sm">
                Manage your account and preferences
              </DialogDescription>
            </div>
            <ScrollArea className="flex-1">
              <nav className="p-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        activeTab === item.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Mobile Header - only visible on small screens */}
            <div className="md:hidden flex items-center justify-between p-4 border-b">
              <DialogTitle className="text-lg font-semibold">
                {navigationItems.find((item) => item.id === activeTab)?.label}
              </DialogTitle>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 md:p-8">
                {activeTab === "profile" && <ProfileSection user={user} />}
                {activeTab === "account" && <AccountSection />}
                {activeTab === "billing" && <BillingSection />}
                {activeTab === "notifications" && <NotificationsSection />}
                {activeTab === "preferences" && <PreferencesSection />}
                {activeTab === "api-keys" && <APIKeysSection />}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Profile Section
function ProfileSection({
  user,
}: {
  user?: { name: string; email: string; avatar: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your personal information and public profile
        </p>
      </div>

      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback className="text-2xl">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Button variant="outline" size="sm">
            Change Avatar
          </Button>
          <p className="text-sm text-muted-foreground">
            JPG, GIF or PNG. Max size of 800K
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            defaultValue={user?.name || ""}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            defaultValue={user?.email || ""}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" placeholder="Tell us a little about yourself" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}

// Account Section
function AccountSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
        <p className="text-muted-foreground">
          Manage your account security and settings
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Account Status</Label>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm">Active</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Password</h3>
            <p className="text-sm text-muted-foreground">
              Last changed 3 months ago
            </p>
          </div>
          <Button variant="outline">Change Password</Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Button variant="outline">Enable 2FA</Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <Button variant="destructive">Delete Account</Button>
        </div>
      </div>
    </div>
  );
}

// Billing Section
function BillingSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Current Plan</h3>
            <p className="text-sm text-muted-foreground">Free Plan</p>
          </div>
          <Button>Upgrade to Pro</Button>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Next billing date</span>
            <span className="font-medium">N/A</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Monthly usage</span>
            <span className="font-medium">0 / 100 credits</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Payment Methods</h3>
        <p className="text-sm text-muted-foreground">
          No payment methods added
        </p>
        <Button variant="outline">Add Payment Method</Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">Invoices</h3>
        <p className="text-sm text-muted-foreground">No invoices available</p>
      </div>
    </div>
  );
}

// Notifications Section
function NotificationsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">
          Manage how you receive notifications
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Email Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Transcription Complete</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when your transcription is ready
                </p>
              </div>
              <Checkbox defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary</Label>
                <p className="text-xs text-muted-foreground">
                  Receive a weekly summary of your activity
                </p>
              </div>
              <Checkbox />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Product Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Stay informed about new features and improvements
                </p>
              </div>
              <Checkbox defaultChecked />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold">Push Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Browser Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications in your browser
                </p>
              </div>
              <Checkbox defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preferences Section
function PreferencesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Preferences</h2>
        <p className="text-muted-foreground">Customize your app experience</p>
      </div>

      <div className="space-y-6">
        {/* AI Summary Preferences */}
        <div className="space-y-4">
          <h3 className="font-semibold">AI Summaries</h3>
          <PreferencesComponent />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold">Appearance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Light
                </Button>
                <Button variant="outline" size="sm">
                  Dark
                </Button>
                <Button variant="outline" size="sm">
                  System
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold">Language</h3>
          <div className="space-y-2">
            <Label htmlFor="language">Interface Language</Label>
            <select
              id="language"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold">Accessibility</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reduced Motion</Label>
                <p className="text-xs text-muted-foreground">
                  Minimize animations throughout the app
                </p>
              </div>
              <Checkbox />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>High Contrast</Label>
                <p className="text-xs text-muted-foreground">
                  Increase contrast for better visibility
                </p>
              </div>
              <Checkbox />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// API Keys Section
function APIKeysSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">API Keys</h2>
        <p className="text-muted-foreground">
          Manage your API keys for external services
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Your API Keys</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage your API keys
            </p>
          </div>
          <Button>Create New Key</Button>
        </div>

        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No API keys created yet</p>
          <p className="text-sm text-muted-foreground">
            Create an API key to integrate with external services
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">API Documentation</h3>
        <p className="text-sm text-muted-foreground">
          Learn how to use our API to build integrations
        </p>
        <Button variant="outline" asChild>
          <a href="/docs/api" target="_blank" rel="noopener noreferrer">
            View Documentation
          </a>
        </Button>
      </div>
    </div>
  );
}
