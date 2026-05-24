"use client";

import { Activity, AlertCircle, Bot, CheckCircle2, Workflow } from "lucide-react";

import StatCard from "./StatCard";
import { useDashboardStats } from "@/hooks/use-dashboard";

const DashboardStats = () => {
  const { data, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Failed to load dashboard metrics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-40 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))
      ) : (
        <>
          <StatCard
            title="Total Workflows"
            value={data?.data?.totalWorkflows ?? 0}
            icon={<Workflow className="h-5 w-5" />}
            description="Configured workflow pipelines running across the platform."
          />

          <StatCard
            title="Total Runs"
            value={data?.data?.totalRuns ?? 0}
            icon={<Activity className="h-5 w-5" />}
            description="Workflow executions triggered across all environments."
          />

          <StatCard
            title="Success Rate"
            value={`${data?.data?.successRate ?? 0}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            description="Execution completion success across recent workflow runs."
          />

          <StatCard
            title="Agents Online"
            value={data?.data?.agentsOnline ?? 0}
            icon={<Bot className="h-5 w-5" />}
            description="Currently connected distributed workers processing tasks."
          />
        </>
      )}
    </div>
  );
};

export default DashboardStats;
