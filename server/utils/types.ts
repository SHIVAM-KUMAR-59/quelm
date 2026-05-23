import { AgentType } from "@prisma/client";

export type Node = {
  id: string;
  type: AgentType;
  name: string;
  critical: boolean;
  config: {
    promptTemplate: string;
    model: string;
    maxTokens: number;
  };
};

export type Edge = {
  id: string;
  source: string;
  target: string;
};

export type WorkflowDefinition = {
  nodes: Node[];
  edges: Edge[];
};

export type JsonInput =
  | string
  | number
  | boolean
  | null
  | JsonInput[]
  | { [key: string]: JsonInput }
  | { toJSON(): unknown };
