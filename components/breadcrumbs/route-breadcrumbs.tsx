"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Use the live sidebar data (title + url) defined in components/sidebar/app-sidebar.tsx
 * to avoid duplicating labels or paths. We import it at runtime and extract a plain
 * structure that excludes React components (icons).
 */
type SidebarData = {
  navMain: {
    title: string;
    url: string;
    items?: { title: string; url: string }[];
  }[];
};

function getSidebarNav(): SidebarData["navMain"] {
  try {
    // The module exports AppSidebar and contains a local `data` constant.
    // We access it via a named export we'll attach below.
    // If not present, fall back to empty array.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@/components/sidebar/app-sidebar") as {
      __sidebarData__?: SidebarData;
    };
    return mod.__sidebarData__?.navMain ?? [];
  } catch {
    return [];
  }
}

function humanize(segment: string) {
  try {
    return segment
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return segment;
  }
}

function buildTitleMap() {
  const nav = getSidebarNav();
  const map = new Map<string, string>();
  for (const item of nav) {
    map.set(item.url, item.title);
    if (item.items?.length) {
      for (const sub of item.items) {
        map.set(sub.url, sub.title);
      }
    }
  }
  return map;
}

function deriveCrumbs(pathname: string): { label: string; url: string }[] {
  const map = buildTitleMap();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Home", url: "/" }];
  }
  const items: { label: string; url: string }[] = [];
  let acc = "";
  for (const s of segments) {
    acc += `/${s}`;
    const label = map.get(acc) ?? humanize(s);
    items.push({ label, url: acc });
  }
  return items;
}

export function RouteBreadcrumbs() {
  const pathname = usePathname() || "/";
  const items = deriveCrumbs(pathname);

  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.length > 3 ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={items[0].url}>{items[0].label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={items[items.length - 2].url}>
                  {items[items.length - 2].label}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{items[items.length - 1].label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <React.Fragment key={item.url}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.url}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default RouteBreadcrumbs;
