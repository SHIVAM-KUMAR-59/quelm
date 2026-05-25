"use client";

import Link from "next/link";
import { Activity, ArrowRight, Clock3, PlayCircle, Workflow } from "lucide-react";

import { useRuns } from "@/hooks/use-run";
import { WorkflowRun } from "@/lib/types";
import ErrorState from "@/components/ui/ErrorState";

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

  FAILED: "border-red-500/20 bg-red-500/10 text-red-400",

  RUNNING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",

  PENDING: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
};

const formatDuration = (startedAt?: string | null, completedAt?: string | null) => {
  if (!startedAt) return "--";

  const start = new Date(startedAt).getTime();

  const end = completedAt ? new Date(completedAt).getTime() : Date.now();

  const seconds = Math.max(0, Math.floor((end - start) / 1000));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins < 60) {
    return `${mins}m ${secs}s`;
  }

  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  return `${hrs}h ${remainingMins}m`;
};

const formatDate = (date?: string | null) => {
  if (!date) return "Unknown";

  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const RunPage = () => {
  const { data: runs, isLoading, error, refetch } = useRuns();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-xl">
          <Activity className="h-3.5 w-3.5" />
          Distributed Execution Monitoring
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Workflow Runs</h1>

          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Observe workflow executions across the Quelm orchestration layer, inspect task
            progress, execution duration, retries, and runtime health in real time.
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to load runs"
          description="Quelm could not retrieve workflow execution history from the orchestration
            layer."
          onRetry={refetch}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-card/20 backdrop-blur-xl">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-6 px-6 py-5"
              >
                <div className="flex items-center gap-5">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />

                  <div className="space-y-3">
                    <div className="h-4 w-56 animate-pulse rounded bg-muted" />

                    <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  </div>
                </div>

                <div className="hidden gap-6 lg:flex">
                  <div className="h-10 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-16 animate-pulse rounded bg-muted" />
                </div>

                <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && runs?.data?.length === 0 && (
        <div className="flex min-h-105 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
            <PlayCircle className="h-7 w-7 text-muted-foreground" />
          </div>

          <h2 className="mt-6 text-xl font-semibold tracking-tight">
            No workflow runs yet
          </h2>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Trigger your first workflow execution to monitor distributed task
            orchestration in real time.
          </p>

          <Link
            href="/workflows"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card-foreground px-4 py-2 text-sm font-medium text-background transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-white hover:shadow-lg hover:shadow-white/5 active:scale-[0.98]"
          >
            <Workflow className="h-4 w-4" />
            Browse Workflows
          </Link>
        </div>
      )}

      {/* Runs Feed */}
      {!isLoading && !error && runs?.data?.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-card/20 backdrop-blur-xl">
          <div className="divide-y divide-border">
            {runs?.data.map((run: WorkflowRun) => (
              <div
                key={run.id}
                className="group flex items-center justify-between gap-6 px-6 py-5 transition-all duration-200 hover:bg-white/2 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]"
              >
                {/* Left */}
                <div className="flex min-w-0 flex-1 items-center gap-5">
                  {/* Status Dot */}
                  <div
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      run.status === "COMPLETED"
                        ? "bg-emerald-400"
                        : run.status === "RUNNING"
                          ? "animate-pulse bg-yellow-400"
                          : run.status === "FAILED"
                            ? "bg-red-400"
                            : "bg-zinc-500"
                    }`}
                  />

                  {/* Workflow */}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
                      {run.workflow.name}
                    </h3>

                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {run.id}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="hidden md:block">
                  <div
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLES[run.status] || STATUS_STYLES.PENDING
                    }`}
                  >
                    {run.status}
                  </div>
                </div>

                {/* Meta */}
                <div className="hidden min-w-[320px] items-center justify-end gap-8 lg:flex">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Started</span>

                    <span className="mt-1 flex items-center gap-2 text-sm">
                      <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(run.startedAt)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Duration</span>

                    <span className="mt-1 text-sm font-medium">
                      {formatDuration(run.startedAt, run.completedAt)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Tasks</span>

                    <span className="mt-1 text-sm">{run.tasks.length}</span>
                  </div>
                </div>

                {/* Action */}
                <Link
                  href={`/runs/${run.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-accent hover:text-foreground"
                >
                  Monitor
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RunPage;
