"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Preferences } from "@/components/settings/Preferences";

export default function SettingsPage() {
  return (
    <div className="container mx-auto pt-8 px-4 md:px-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Content Section with Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Profile settings coming soon. Update your personal information and
              account details.
            </p>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Preferences />
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              API Keys management coming soon. Configure and manage your API
              keys for external services.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
