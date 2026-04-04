"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appRoutes } from "@/lib/navigation";

const isRouteActive = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === href : pathname.startsWith(href);

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-surface/80 px-3 py-5 xl:sticky xl:top-0 xl:h-screen">
      <div className="mb-5 px-3">
        <p className="font-[family-name:var(--font-bricolage)] text-sm font-semibold tracking-tight text-accent">
          Hermes Console
        </p>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {appRoutes.map((route) => {
          const active = isRouteActive(pathname, route.href);

          return (
            <Link
              key={route.href}
              href={route.href}
              className={[
                "relative rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "border-l-2 border-accent bg-accent/10 font-medium text-fg-strong"
                  : "border-l-2 border-transparent text-fg-muted hover:bg-white/5 hover:text-fg",
              ].join(" ")}
            >
              {route.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
