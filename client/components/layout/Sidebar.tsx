"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-semibold tracking-tight">Quelm</h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-sidebar-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-foreground",
                )}
              />
              <span className="truncate">{item.label}</span>

              {/* subtle active indicator */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/70" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
