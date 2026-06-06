import { vi } from "vitest";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.GROQ_API_KEY = "test-groq-key";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret";

vi.mock("winston", () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
    add: vi.fn(),
    success: vi.fn(),
  };

  return {
    createLogger: vi.fn(() => mockLogger),
    format: {
      combine: vi.fn(),
      printf: vi.fn(),
      timestamp: vi.fn(),
      colorize: vi.fn(() => ({ colorize: vi.fn(() => "") })),
      errors: vi.fn(),
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn(),
    },
    addColors: vi.fn(),
  };
});

vi.mock("ioredis", () => {
  const mockRedisInstance = {
    on: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    duplicate: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
  };

  function Redis() {
    return mockRedisInstance;
  }
  Redis.prototype = mockRedisInstance;

  return { default: Redis, Redis };
});

vi.mock("groq-sdk", () => {
  const MockGroq = vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Mock Groq response" } }],
        }),
      },
    },
  }));

  return { default: MockGroq };
});

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$mockedhash"),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue("$2a$12$mockedhash"),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock("@prisma/client", async () => {
  const AgentType = {
    LLM_AGENT: "LLM_AGENT",
    HTTP_AGENT: "HTTP_AGENT",
    TRANSFORM_AGENT: "TRANSFORM_AGENT",
    EXTRACTION_AGENT: "EXTRACTION_AGENT",
    NOTIFICATION_AGENT: "NOTIFICATION_AGENT",
    STORAGE_AGENT: "STORAGE_AGENT",
  };

  const TaskStatus = {
    PENDING: "PENDING",
    RUNNING: "RUNNING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
  };

  const RunStatus = {
    PENDING: "PENDING",
    RUNNING: "RUNNING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
  };

  const AgentStatus = {
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE",
    BUSY: "BUSY",
  };

  function createModelMethods() {
    return {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    };
  }

  const MockPrismaClient = vi.fn(() => ({
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    agent: createModelMethods(),
    task: createModelMethods(),
    workflowDefinition: createModelMethods(),
    workflowRun: createModelMethods(),
    user: createModelMethods(),
    refreshToken: createModelMethods(),
  }));

  return {
    PrismaClient: MockPrismaClient,
    AgentType,
    TaskStatus,
    RunStatus,
    AgentStatus,
  };
});

vi.mock("bullmq", () => {
  const mockQueueInstance = {
    add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
    getJob: vi
      .fn()
      .mockResolvedValue({ id: "mock-job-id", data: { taskId: "mock-task-id" } }),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnThis(),
  };

  const mockWorkerInstance = {
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnThis(),
  };

  const mockQueueEventsInstance = {
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
    name: "mock-queue",
  };

  function Queue() {
    return mockQueueInstance;
  }
  function Worker() {
    return mockWorkerInstance;
  }
  function QueueEvents() {
    return mockQueueEventsInstance;
  }
  function Job() {}

  Queue.prototype = mockQueueInstance;
  Worker.prototype = mockWorkerInstance;
  QueueEvents.prototype = mockQueueEventsInstance;

  return { Queue, Worker, QueueEvents, Job };
});
