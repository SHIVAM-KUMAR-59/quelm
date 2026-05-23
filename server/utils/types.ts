import { AgentType } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

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

export type JsonInput = Record<string, unknown>;

// Basic controller type
export type Controller = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

// Controller with typed body
export type BodyController<T> = (
  req: Request<object, object, T>,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

// Controller with typed params
export type ParamsController<T extends Record<string, string>> = (
  req: Request<T>,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

// Controller with typed body + params
export type BodyParamsController<
  TBody,
  TParams extends Record<string, string> = Record<string, string>,
> = (
  req: Request<TParams, object, TBody>,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

// Controller with typed query
export type QueryController<T> = (
  req: Request<object, object, object, T>,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

// Middleware
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;
