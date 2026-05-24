"use client";

import { AlertCircle, Clock3 } from "lucide-react";

import { useRecentRuns } from "@/hooks/use-dashboard";
import { RecentRun } from "@/lib/types";

const RecentRuns = () => {
  const { data, isLoading, error } = useRecentRuns();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent Workflow Runs</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Latest orchestration executions across all workflows.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-6 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Failed to load recent workflow runs.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4 p-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !data?.data?.length && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40">
            <Clock3 className="h-6 w-6 text-muted-foreground" />
          </div>

          <div>
            <h3 className="text-base font-medium">No workflow runs yet</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Trigger a workflow execution to start seeing live run activity.
            </p>
          </div>
        </div>
      )}

      {/* Data */}
      {!isLoading && !error && data?.data?.length > 0 && (
        <div className="divide-y divide-border">
          {data?.data.map((run: RecentRun) => (
            <div
              key={run.id}
              className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-muted/20 md:flex-row md:items-center md:justify-between"
            >
              {/* Left */}
              <div className="space-y-1">
                <h3 className="font-medium tracking-tight">{run.workflowName}</h3>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{run.taskCount} tasks</span>

                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />

                  <span>{run.duration}s duration</span>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    run.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : run.status === "FAILED"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {run.status}
                </div>

                <div className="text-sm text-muted-foreground">
                  {run.completedAt
                    ? new Date(run.completedAt).toLocaleString()
                    : "In Progress"}{" "}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentRuns;
