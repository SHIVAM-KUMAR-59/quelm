import { LayoutDashboard, Workflow, Play, Bot } from "lucide-react";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Workflows",
    href: "/workflows",
    icon: Workflow,
  },
  {
    label: "Runs",
    href: "/runs",
    icon: Play,
  },
  {
    label: "Agents",
    href: "/agents",
    icon: Bot,
  },
];

export const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/workflows": "Workflows",
  "/runs": "Runs",
  "/agents": "Agents",
};
