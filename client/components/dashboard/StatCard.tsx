import React from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
};

const StatCard = ({ title, value, icon, description }: StatCardProps) => {
  const isEmpty =
    value === 0 || value === "0" || value === "" || value === null || value === undefined;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-border hover:bg-card",
        "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_8px_30px_rgba(0,0,0,0.35)]",
      )}
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/2 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <div className="flex items-end gap-2">
            <h3
              className={cn(
                "text-3xl font-semibold tracking-tight",
                isEmpty && "text-muted-foreground/60",
              )}
            >
              {isEmpty ? "—" : value}
            </h3>
          </div>
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300",
            isEmpty
              ? "border-border/60 bg-muted/40 text-muted-foreground"
              : "border-border bg-secondary text-foreground group-hover:bg-accent",
          )}
        >
          <div className="h-5 w-5">{icon}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5">
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <span>No additional insights available</span>
          </div>
        )}
      </div>

      {/* Empty state overlay */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
      )}
    </div>
  );
};

export default StatCard;
