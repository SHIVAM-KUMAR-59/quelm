"use client";

import { AlertCircle } from "lucide-react";
import { Node, Handle, NodeProps, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { AgentNodeData } from "@/lib/types";

import { AGENT_META } from "@/lib/constants/agent.constants";
import { STATUS_STYLES } from "@/lib/constants/status.constants";

const AgentNode = ({ data, selected }: NodeProps<Node<AgentNodeData>>) => {
  const meta = AGENT_META[data.type] ?? AGENT_META["LLM_AGENT"];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "group relative w-87.5 rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl transition-all duration-300",
        "hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]",
        selected && "border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.08)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br opacity-60",
          meta.accent,
        )}
      />

      <Handle
        type="target"
        position={Position.Left}
        className="h-3! w-3! border-2! border-background! bg-zinc-400!"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-3! w-3! border-2! border-background! bg-zinc-400!"
      />

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 backdrop-blur">
              <Icon className="h-5 w-5 text-white" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {meta.label}
              </p>
              <h3 className="max-w-35 truncate text-sm font-semibold tracking-tight">
                {data.label}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.critical && (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              </div>
            )}
            <div className={cn("h-2.5 w-2.5 rounded-full", STATUS_STYLES[data.status])} />
          </div>
        </div>

        <div className="my-4 h-px bg-border/80" />

        <div className="space-y-2">
          {data.type === "LLM_AGENT" && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">
                  {(data.config as { model?: string })?.model || "Not set"}
                </span>
              </div>
              <div className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {(data.config as { promptTemplate?: string })?.promptTemplate ||
                  "No prompt configured yet"}
              </div>
            </>
          )}

          {data.type === "HTTP_AGENT" && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">
                  {(data.config as { method?: string })?.method || "GET"}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {(data.config as { url?: string })?.url || "No endpoint configured"}
              </div>
            </>
          )}

          {data.type === "TRANSFORM_AGENT" && (
            <div className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {(data.config as { description?: string })?.description ||
                "No transformation configured"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentNode;
