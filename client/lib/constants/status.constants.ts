import { AgentNodeData } from "@/lib/types";

export const STATUS_STYLES: Record<AgentNodeData["status"], string> = {
  idle: "bg-zinc-500",
  running: "bg-yellow-400 animate-pulse",
  success: "bg-emerald-400",
  error: "bg-red-400",
};

export const RUN_STATUS_STYLES: Record<string, string> = {
  RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export const AGENT_STATUS_STYLES: Record<string, string> = {
  ONLINE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  BUSY: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  OFFLINE: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
};

export const STATUS_DOT: Record<string, string> = {
  ONLINE: "bg-emerald-400",
  BUSY: "bg-yellow-400",
  OFFLINE: "bg-zinc-500",
};
