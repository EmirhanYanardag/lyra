import type { ReactNode } from "react";
import { NavLinks } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils/cn";

export function AppShell({
  children,
  mainClassName,
}: {
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="app-auth-bg lyra-bg min-h-screen">
      <NavLinks />
      <div className="mx-auto min-h-screen w-full max-w-7xl">
        <main className={cn("px-5 pb-16 pt-32 sm:px-8 lg:px-10", mainClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}
