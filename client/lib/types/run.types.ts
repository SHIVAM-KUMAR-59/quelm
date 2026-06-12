export type RecentRun = {
  id: string;
  workflowName: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  startedAt: string;
  completedAt: string | null;
  taskCount: number;
  duration: number | null;
};

export type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type AgentStatus = "ONLINE" | "OFFLINE" | "BUSY";

export type Task = {
  id: string;
  runId: string;
  name: string;
  type: string;
  status: TaskStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  critical: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  dependsOn: string[];
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  status: RunStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  tasks: Task[];
  workflow: {
    id: string;
    name: string;
    definition: import("./builder.types").WorkflowDefinition;
  };
};

export type Agent = {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  lastSeenAt: string | null;
  tasksHandled: number;
  tasksFailed: number;
  createdAt: string;
};
