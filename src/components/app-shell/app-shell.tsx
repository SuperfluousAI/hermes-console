import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { AppTopbar } from "@/components/app-shell/app-topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg xl:grid xl:grid-cols-[14rem_minmax(0,1fr)]">
      <AppSidebar />
      <div className="min-w-0">
        <AppTopbar />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 lg:px-6 lg:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
