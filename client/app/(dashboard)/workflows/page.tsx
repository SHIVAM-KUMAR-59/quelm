"use client";

import { FolderGit2, Plus, Workflow as WorkflowIcon } from "lucide-react";

import { useWorkflows } from "@/hooks/use-workflow";
import WorkflowCard from "@/components/workflows/WorkflowCard";
import Link from "next/link";
import ErrorState from "@/components/ui/ErrorState";
import { Workflow } from "@/lib/types";

const WorkflowPage = () => {
  const { data: workflows, isLoading, error, refetch } = useWorkflows();

  if (error) {
    return (
      <ErrorState
        title="Failed to load workflows"
        description="Quelm could not retrieve workflow definitions from the orchestration layer."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-xl">
            <WorkflowIcon className="h-3.5 w-3.5" />
            Visual Workflow Builder
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Workflows</h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Create, orchestrate, and monitor distributed AI workflows across your Quelm
            cluster.
          </p>
        </div>

        <Link
          href={"/workflows/new"}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card-foreground px-4 py-2 text-sm font-medium text-background transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-white hover:shadow-lg hover:shadow-white/5 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-56 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && workflows?.data?.length === 0 && (
        <div className="flex min-h-105 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
            <FolderGit2 className="h-7 w-7 text-muted-foreground" />
          </div>

          <h2 className="mt-6 text-xl font-semibold tracking-tight">No workflows yet</h2>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Start building distributed AI pipelines by creating your first workflow.
          </p>

          <Link
            href={"/workflows/new"}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card-foreground px-4 py-2 text-sm font-medium text-background transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-white hover:shadow-lg hover:shadow-white/5 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </Link>
        </div>
      )}

      {/* Workflow Grid */}
      {!isLoading && !error && workflows?.data?.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workflows?.data.map((workflow: Workflow) => (
            <WorkflowCard
              key={workflow.id}
              id={workflow.id}
              name={workflow.name}
              description={workflow.description}
              nodeCount={workflow.definition?.nodes?.length || 0}
              createdAt={workflow.createdAt}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default WorkflowPage;
