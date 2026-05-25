"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  Node,
  Edge,
} from "@xyflow/react";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useRunStream } from "@/hooks/use-run-stream";
import AgentNode from "@/components/workflows/builder/AgentNode";
import { AgentNodeData, Task, WorkflowDefinition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRun } from "@/hooks/use-run";
import RunOutputPanel from "@/components/monitor/RunOutputPanel";

const nodeTypes = { agentNode: AgentNode };

type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

const STATUS_TO_NODE: Record<TaskStatus, AgentNodeData["status"]> = {
  PENDING: "idle",
  RUNNING: "running",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "idle",
};

const RUN_STATUS_STYLES: Record<string, string> = {
  RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const RunMonitorPage = () => {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();

  const { data: runData, refetch } = useRun(runId);
  const { events, connected } = useRunStream(runId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedTask, setSelectedTask] = useState<{
    id: string;
    name: string;
    input: unknown;
    output: unknown;
    error: string | null;
    attempts: number;
    duration: number | null;
  } | null>(null);

  const run = runData?.data;

  // Build canvas from run tasks on initial load
  useEffect(() => {
    if (!run) return;

    const definition = run.workflow?.definition as {
      nodes: Array<{
        id: string;
        type: string;
        name: string;
        critical: boolean;
        config: unknown;
      }>;
      edges: Array<{ id: string; source: string; target: string }>;
    };

    if (!definition) return;

    // Map task names to task data for status lookup
    const taskMap = new Map(run.tasks?.map((t: Task) => [t.name, t]));

    const flowNodes: Node<AgentNodeData>[] = definition.nodes.map((node, index) => {
      const task = taskMap.get(node.name) as Task;
      const status = task ? STATUS_TO_NODE[task.status as TaskStatus] : "idle";

      return {
        id: node.id,
        type: "agentNode",
        position: { x: 100 + 400 * index, y: 250 },
        data: {
          label: node.name,
          type: node.type as AgentNodeData["type"],
          config: node.config as AgentNodeData["config"],
          critical: node.critical,
          status,
        },
      };
    });

    const flowEdges: Edge[] = definition.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: run.status === "RUNNING",
      style: { stroke: "#71717a", strokeWidth: 2 },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [run]);

  // Update node status from SSE events
  useEffect(() => {
    if (!events.length || !run) return;

    const latestEvent = events[events.length - 1];

    // Handle workflow-level events
    if (latestEvent.type === "RUN_COMPLETED" || latestEvent.type === "RUN_FAILED") {
      refetch();
      return;
    }

    if (!latestEvent.taskId || !latestEvent.status) return;

    // Find the task in the initial run data
    const task = run.tasks?.find((t: Task) => t.id === latestEvent.taskId);

    if (!task) return;

    // Find the corresponding node in workflow definition
    const definition = run.workflow?.definition as WorkflowDefinition;

    const node = definition?.nodes?.find((n) => n.name === task.name);

    if (!node) return;

    // Map backend task status -> frontend node status
    const newStatus = STATUS_TO_NODE[latestEvent.status as TaskStatus] ?? "idle";

    // Update node state live
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id
          ? {
              ...n,
              data: {
                ...n.data,
                status: newStatus,
              },
            }
          : n,
      ),
    );
  }, [events, run, refetch, setNodes]);

  const onNodeClick = (_: React.MouseEvent, node: Node<AgentNodeData>) => {
    if (!run) return;
    const task = run.tasks?.find((t: Task) => t.name === node.data.label);
    if (!task) return;

    const duration =
      task.completedAt && task.startedAt
        ? Math.round(
            (new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) /
              1000,
          )
        : null;

    setSelectedTask({
      id: task.id,
      name: task.name,
      input: task.input,
      output: task.output,
      error: task.error,
      attempts: task.attempts,
      duration,
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Topbar */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/runs")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-all hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {run?.workflow?.name ?? "Loading..."}
            </h1>
            <p className="text-xs text-muted-foreground">
              Run ID: {runId.slice(0, 12)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                connected ? "bg-emerald-400 animate-pulse" : "bg-zinc-500",
              )}
            />
            {connected ? "Live" : "Disconnected"}
          </div>

          {/* Run status badge */}
          {run?.status && (
            <div
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                RUN_STATUS_STYLES[run.status],
              )}
            >
              {run.status}
            </div>
          )}

          {/* Stats */}
          {run && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>
                  {run.tasks?.filter((t: Task) => t.status === "COMPLETED").length ?? 0}{" "}
                  done
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>
                  {run.tasks?.filter((t: Task) => t.status === "FAILED").length ?? 0}{" "}
                  failed
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{run.tasks?.length ?? 0} total</span>
              </div>
            </div>
          )}
        </div>
      </header>
      {/* Canvas */}
      <div className="mt-16 h-[calc(100vh-4rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
        >
          <Background />
          <Controls className="bg-card! border-border! [&>button]:bg-card! [&>button]:border-border! [&>button]:text-foreground! [&>button:hover]:bg-accent!" />
          <MiniMap className="bg-card!" nodeColor="#3f3f46" maskColor="rgba(0,0,0,0.6)" />
        </ReactFlow>
      </div>
      {/* Task Detail Drawer */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-2xl rounded-t-3xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedTask.name}</h2>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {selectedTask.duration !== null && <span>{selectedTask.duration}s</span>}

                <span>Attempt {selectedTask.attempts}</span>

                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-lg border border-border p-1.5 hover:bg-accent"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Input / Output */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Input
                </p>

                <pre className="max-h-48 overflow-auto rounded-xl border border-border bg-background p-4 text-xs">
                  {JSON.stringify(selectedTask.input, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Output
                </p>

                <pre className="max-h-48 overflow-auto rounded-xl border border-border bg-background p-4 text-xs">
                  {selectedTask.output
                    ? JSON.stringify(selectedTask.output, null, 2)
                    : (selectedTask.error ?? "No output yet")}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Final Run Output Panel */}
      {run && (
        <RunOutputPanel
          status={run.status}
          output={run.output}
          error={run.error}
          duration={
            run.completedAt && run.startedAt
              ? Math.round(
                  (new Date(run.completedAt).getTime() -
                    new Date(run.startedAt).getTime()) /
                    1000,
                )
              : null
          }
        />
      )}{" "}
    </div>
  );
};

export default RunMonitorPage;
