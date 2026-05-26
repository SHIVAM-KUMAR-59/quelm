"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronUp, Copy, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type RunOutputPanelProps = {
  status: string;
  output: Record<string, unknown> | null;
  error: string | null;
  duration: number | null;
};

const RunOutputPanel = ({ status, output, error, duration }: RunOutputPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";

  const formattedContent = useMemo(() => {
    if (isFailed) {
      return error || "Unknown execution error";
    }

    // If output has a text field, return it directly for readable rendering
    if (output && typeof output.text === "string") {
      return output.text;
    }

    return JSON.stringify(output, null, 2);
  }, [isFailed, output, error]);

  // Early return AFTER hooks
  if (!isCompleted && !isFailed) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      console.error("Failed to copy output");
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-2xl transition-all duration-300",
        expanded ? "h-90" : "h-14",
        isCompleted
          ? "border-emerald-500/20 bg-emerald-500/3"
          : "border-red-500/20 bg-red-500/3",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
        {/* collapsed / header */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex h-14 w-full items-center justify-between px-6 transition-colors hover:bg-white/2"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl border",
                isCompleted
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-red-500/20 bg-red-500/10",
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>

            <div className="flex flex-col items-start">
              <p className="text-sm font-medium text-white">
                {expanded ? "Final Output" : "View Final Output"}
              </p>

              <p className="text-xs text-muted-foreground">
                {isCompleted ? "Execution completed" : "Execution failed"}
                {duration !== null && ` • ${duration}s`}
              </p>
            </div>
          </div>

          <ChevronUp
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </button>

        {/* expanded content */}
        {expanded && (
          <div className="flex h-[calc(100%-56px)] flex-col overflow-hidden border-t border-white/5">
            {/* toolbar */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isCompleted ? "bg-emerald-400" : "bg-red-400",
                  )}
                />

                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {isCompleted ? "Workflow Output" : "Workflow Error"}
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-white/6"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* content */}
            <div className="flex-1 overflow-auto p-6">
              <pre
                className={cn(
                  "overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-2xl border p-5 text-sm leading-relaxed",
                  isCompleted
                    ? "border-emerald-500/10 bg-black/30 text-emerald-100"
                    : "border-red-500/10 bg-black/30 text-red-200",
                )}
              >
                {formattedContent}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunOutputPanel;
