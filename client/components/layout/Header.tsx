"use client";

import { usePathname } from "next/navigation";
import { PAGE_TITLES } from "@/lib/constants/navigation";

const Header = () => {
  const pathname = usePathname();

  const title =
    PAGE_TITLES[pathname] ??
    pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border bg-background/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>

        {/* subtle breadcrumb glow line */}
        <div className="h-4 w-px bg-border opacity-50" />

        <span className="text-xs text-muted-foreground">Workflow Platform</span>
      </div>
    </header>
  );
};

export default Header;
