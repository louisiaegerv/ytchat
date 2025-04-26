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
import { createClient } from "@/utils/supabase/server";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
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
              <AppSidebar />
              <SidebarInset>
                <header className="sticky top-0 z-30 bg-background rounded-t-lg flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                  <SidebarTrigger />

                  <nav aria-label="breadcrumb">
                    <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
                      <li className="items-center gap-1.5 hidden md:block">
                        <a
                          className="transition-colors hover:text-foreground"
                          href="#"
                        >
                          Building Your Application
                        </a>
                      </li>
                      <li
                        role="presentation"
                        aria-hidden="true"
                        className="[&amp;>svg]:w-3.5 [&amp;>svg]:h-3.5 hidden md:block"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chevron-right"
                        >
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </li>
                      <li className="inline-flex items-center gap-1.5">
                        <span
                          role="link"
                          aria-disabled="true"
                          aria-current="page"
                          className="font-normal text-foreground"
                        >
                          Data Fetching
                        </span>
                      </li>
                    </ol>
                  </nav>
                </header>

                {/* Main content */}
                <main
                  className="flex-1 flex flex-col items-center"
                  style={{ scrollbarWidth: "none" }}
                >
                  {children}
                </main>
              </SidebarInset>
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
