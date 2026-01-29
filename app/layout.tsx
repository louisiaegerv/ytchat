import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { GlobalDataProvider } from "@/components/GlobalDataContext";
import { PinnedCollectionsProvider } from "@/components/PinnedCollectionsContext";
import { BottomNavigation } from "@/components/bottom-navigation";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Slipstream - YouTube Intelligence Platform",
  description: "Go beyond the limits of YouTube.",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isAuthenticated ? (
            <SidebarProvider>
              <GlobalDataProvider>
                <PinnedCollectionsProvider>
                  <AppSidebar />
                  <SidebarInset>
                    {/* Main content */}
                    <main
                      className="flex-1 flex flex-col items-center"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {children}
                    </main>

                    {/* Bottom Navigation */}
                    <BottomNavigation />
                  </SidebarInset>
                </PinnedCollectionsProvider>
              </GlobalDataProvider>
              <Toaster />
            </SidebarProvider>
          ) : (
            <main className="min-h-screen flex flex-col items-center justify-center">
              {children}
            </main>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
