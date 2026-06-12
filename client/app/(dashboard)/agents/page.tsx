"use client";

import Link from "next/link";
import { Bot, Server, Workflow } from "lucide-react";

import { useAgents } from "@/hooks/use-agent";
import { Agent } from "@/lib/types";
import ErrorState from "@/components/ui/ErrorState";

import { AGENT_ICONS } from "@/lib/constants/agent.constants";
import {
  AGENT_STATUS_STYLES as STATUS_STYLES,
  STATUS_DOT,
} from "@/lib/constants/status.constants";

const formatLastSeen = (date?: string | null) => {
  if (!date) return "Unknown";

  const now = Date.now();
  const lastSeen = new Date(date).getTime();

  const diff = Math.floor((now - lastSeen) / 1000);

  if (diff < 60) {
    return `${diff}s ago`;
  }

  const mins = Math.floor(diff / 60);

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  const days = Math.floor(hrs / 24);

  return `${days}d ago`;
};

const AgentsPage = () => {
  const { data: agents, isLoading, error, refetch } = useAgents();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-xl">
          <Server className="h-3.5 w-3.5" />
          Distributed Worker Infrastructure
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Agent Cluster</h1>

          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Monitor all registered workflow agents across the Quelm execution layer,
            inspect runtime health, task throughput, and orchestration availability in
            real time.
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to load agents"
          description="Quelm could not retrieve worker heartbeat data from the orchestration layer."
          onRetry={refetch}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-white/5 bg-card/20 p-6 backdrop-blur-xl"
            >
              <div className="animate-pulse space-y-5">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-muted" />
                  <div className="h-6 w-20 rounded-full bg-muted" />
                </div>

                <div className="space-y-3">
                  <div className="h-5 w-40 rounded bg-muted" />
                  <div className="h-4 w-28 rounded bg-muted" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 rounded-2xl bg-muted" />
                  <div className="h-16 rounded-2xl bg-muted" />
                </div>

                <div className="h-20 w-full bg-muted rounded-2xl" />

                <div className="h-4 w-32 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && agents?.data?.length === 0 && (
        <div className="flex min-h-105 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
            <Bot className="h-7 w-7 text-muted-foreground" />
          </div>

          <h2 className="mt-6 text-xl font-semibold tracking-tight">
            No agents registered
          </h2>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Start a worker process to register execution agents with the Quelm
            orchestration layer.
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

      {/* Agents Grid */}
      {!isLoading && !error && agents?.data?.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agents?.data.map((agent: Agent) => {
            const Icon = AGENT_ICONS[agent.type] || Bot;

            return (
              <div
                key={agent.id}
                className="group rounded-3xl border border-white/5 bg-card/20 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-card/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]"
              >
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLES[agent.status]
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${STATUS_DOT[agent.status]} ${
                        agent.status === "BUSY" ? "animate-pulse" : ""
                      }`}
                    />

                    {agent.status}
                  </div>
                </div>

                {/* Agent Info */}
                <div className="mt-5">
                  <h3 className="text-lg font-semibold tracking-tight">{agent.name}</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {agent.type.replaceAll("_", " ")}
                  </p>
                </div>

                {/* Metrics */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <p className="text-xs text-muted-foreground">Tasks Handled</p>

                    <h4 className="mt-2 text-2xl font-semibold tracking-tight">
                      {agent.tasksHandled}
                    </h4>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <p className="text-xs text-muted-foreground">Failed Tasks</p>

                    <h4 className="mt-2 text-2xl font-semibold tracking-tight">
                      {agent.tasksFailed}
                    </h4>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-border bg-background/40 p-4">
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <h4 className="mt-2 text-2xl font-semibold tracking-tight">
                      {agent.tasksHandled === 0
                        ? "—"
                        : `${Math.round(((agent.tasksHandled - agent.tasksFailed) / agent.tasksHandled) * 100)}%`}
                    </h4>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Last Seen</p>

                    <p className="mt-1 text-sm font-medium">
                      {formatLastSeen(agent.lastSeenAt)}
                    </p>
                  </div>

                  <div
                    className={`rounded-full border px-3 py-1.5 text-xs ${STATUS_STYLES[agent.status]}`}
                  >
                    {agent.status === "ONLINE"
                      ? "Active"
                      : agent.status === "BUSY"
                        ? "Processing"
                        : "Inactive"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AgentsPage;
