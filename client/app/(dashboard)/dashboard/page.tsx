"use client";

import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentRuns from "@/components/dashboard/RecentRuns";

const Page = () => {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* Hero */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Workflow Overview</h1>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Monitor workflow execution health, distributed agent activity, orchestration
          metrics, and real-time pipeline execution across your Quelm cluster.
        </p>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Recent Runs */}
      <RecentRuns />
    </section>
  );
};

export default Page;
