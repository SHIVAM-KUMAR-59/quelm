export type RecentRun = {
  id: string;
  workflowName: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  startedAt: string;
  completedAt: string | null;
  taskCount: number;
  duration: number | null;
};

export type Workflow = {
  id: string;
  name: string;
  description: string | null;
  definition: { nodes: unknown[]; edges: unknown[] };
  createdAt: string;
  updatedAt: string;
};

export type AgentType =
  | "LLM_AGENT"
  | "HTTP_AGENT"
  | "TRANSFORM_AGENT"
  | "EXTRACTION_AGENT"
  | "NOTIFICATION_AGENT"
  | "STORAGE_AGENT";

export type LLMConfig = {
  promptTemplate: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

export type HTTPConfig = {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
};

export type TransformConfig = {
  description: string;
};

export type AgentConfig = LLMConfig | HTTPConfig | TransformConfig;

export type AgentNodeData = {
  label: string;
  type: AgentType;
  config: AgentConfig;
  critical: boolean;
  status: "idle" | "running" | "success" | "error";
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

export type WorkflowDefinition = {
  nodes: Array<{
    id: string;
    type: AgentNodeData["type"];
    name: string;
    critical: boolean;
    config: AgentNodeData["config"];
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
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
    definition: WorkflowDefinition;
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
