"use client";

import "@xyflow/react/dist/style.css";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  GitBranch,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "@xyflow/react";
import { useEffect } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { useWorkflow, useTriggerRun, useDeleteWorkflow } from "@/hooks/use-workflow";
import { useWorkflowRuns } from "@/hooks/use-run";
import AgentNode from "@/components/workflows/builder/AgentNode";
import ErrorState from "@/components/ui/ErrorState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgentNodeData, WorkflowDefinition } from "@/lib/types";
import { WorkflowRun } from "@/lib/types";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const nodeTypes = { agentNode: AgentNode };

const RUN_STATUS_STYLES: Record<string, string> = {
  RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const WorkflowDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: workflowData,
    isLoading: workflowLoading,
    error: workflowError,
  } = useWorkflow(id);
  const {
    data: runsData,
    isLoading: runsLoading,
    error: runsError,
    refetch: refetchRuns,
  } = useWorkflowRuns(id);
  const { mutateAsync: triggerRun, isPending } = useTriggerRun();
  const { mutateAsync: deleteWorkflow, isPending: isDeleting } = useDeleteWorkflow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inputJson, setInputJson] = useState("{\n  \n}");

  const workflow = workflowData?.data;
  const runs: WorkflowRun[] = runsData?.data ?? [];

  // Build canvas from workflow definition
  useEffect(() => {
    if (!workflow) return;

    const definition = workflow.definition as WorkflowDefinition;
    if (!definition?.nodes) return;

    const flowNodes: Node<AgentNodeData>[] = definition.nodes.map((node, index) => ({
      id: node.id,
      type: "agentNode",
      position: { x: 100 + 400 * index, y: 100 },
      data: {
        label: node.name,
        type: node.type,
        config: node.config,
        critical: node.critical,
        status: "idle",
      },
    }));

    const flowEdges: Edge[] = definition.edges.map((edge: Edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: false,
      style: { stroke: "#71717a", strokeWidth: 2 },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [workflow]);

  const handleExecute = async () => {
    try {
      const input = JSON.parse(inputJson);
      const result = await triggerRun({ id, input });
      toast.success("Workflow triggered successfully");
      setModalOpen(false);
      router.push(`/runs/${result.data.runId}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON input");
      } else {
        toast.error("Failed to trigger workflow");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorkflow(id);
      toast.success("Workflow deleted successfully");
      router.push("/workflows");
    } catch {
      toast.error("Failed to delete workflow");
    }
  };

  // Loading state
  if (workflowLoading) {
    return (
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-card" />
            <div className="space-y-2">
              <div className="h-8 w-64 animate-pulse rounded-xl bg-card" />
              <div className="h-4 w-48 animate-pulse rounded-lg bg-card" />
            </div>
          </div>
          <div className="h-10 w-24 animate-pulse rounded-xl bg-card" />
        </div>

        {/* Canvas skeleton */}
        <div className="h-100 animate-pulse rounded-2xl border border-border bg-card" />

        {/* Runs skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-card" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (workflowError) {
    return (
      <ErrorState
        title="Failed to load workflow"
        description="Could not retrieve this workflow definition from the server."
        onRetry={() => router.refresh()}
      />
    );
  }

  if (!workflow) return null;

  return (
    <>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/workflows"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-all hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">{workflow.name}</h1>

              {workflow.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {workflow.description}
                </p>
              )}

              <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span>{workflow.definition?.nodes?.length ?? 0} nodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Created {new Date(workflow.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all duration-300 hover:bg-red-500/20 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card-foreground px-4 py-2 text-sm font-medium text-background transition-all duration-300 hover:scale-[1.03] hover:bg-white hover:shadow-lg active:scale-[0.98]"
            >
              <Play className="h-4 w-4" />
              Run Workflow
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium">Workflow Graph</h2>
            <span className="text-xs text-muted-foreground">Read only</span>
          </div>

          <div className="h-95">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background />
            </ReactFlow>
          </div>
        </div>

        {/* Runs section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Run History</h2>
            <span className="text-sm text-muted-foreground">
              {runs.length} total run{runs.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Runs error */}
          {runsError && (
            <ErrorState
              title="Failed to load runs"
              description="Could not retrieve run history for this workflow."
              onRetry={() => refetchRuns()}
            />
          )}

          {/* Runs loading */}
          {runsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          )}

          {/* Empty runs */}
          {!runsLoading && !runsError && runs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/40">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-base font-medium">No runs yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Trigger a run to see execution history here.
                </p>
              </div>
            </div>
          )}

          {/* Runs list */}
          {!runsLoading && !runsError && runs.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border">
              {runs.map((run, index) => {
                const duration =
                  run.completedAt && run.startedAt
                    ? Math.round(
                        (new Date(run.completedAt).getTime() -
                          new Date(run.startedAt).getTime()) /
                          1000,
                      )
                    : null;

                return (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    className={cn(
                      "flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/20",
                      index !== runs.length - 1 && "border-b border-border",
                    )}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          Run {run.id.slice(0, 8)}...
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(run.startedAt).toLocaleString()}</span>
                          {duration !== null && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              <span>{duration}s</span>
                            </>
                          )}
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                          <span>{run.tasks?.length ?? 0} tasks</span>
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            {run.tasks?.filter((t) => t.status === "COMPLETED").length ??
                              0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                          <span>
                            {run.tasks?.filter((t) => t.status === "FAILED").length ?? 0}
                          </span>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium",
                          RUN_STATUS_STYLES[run.status],
                        )}
                      >
                        {run.status}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{workflow.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Delete Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Trigger Run</h2>
              <p className="text-sm text-muted-foreground">
                Provide the JSON input payload for{" "}
                <span className="font-medium text-foreground">{workflow.name}</span>
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <MonacoEditor
                height="200px"
                language="json"
                theme="vs-dark"
                value={inputJson}
                onChange={(val) => setInputJson(val ?? "{}")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "off",
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: "none",
                  overviewRulerLanes: 0,
                }}
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-card-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:bg-white disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {isPending ? "Triggering..." : "Execute"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowDetailPage;
