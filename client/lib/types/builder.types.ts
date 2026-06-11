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
