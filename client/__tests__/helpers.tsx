/**
 * Shared render wrapper that supplies React Query's QueryClient.
 * Import `render` and `screen` from here instead of @testing-library/react
 * so every test gets the providers automatically.
 */
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Fresh QueryClient per test — prevents state leaking between tests
// ---------------------------------------------------------------------------
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests — fail fast
        gcTime: Infinity, // Keep data so we can inspect it
      },
    },
  });
}

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = makeQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// ---------------------------------------------------------------------------
// Mock factory helpers used across multiple test files
// ---------------------------------------------------------------------------

export const mockWorkflow = (overrides = {}) => ({
  id: "wf-1",
  name: "Test Workflow",
  description: "A test workflow",
  createdAt: "2024-01-15T10:00:00Z",
  definition: {
    nodes: [
      { id: "n1", type: "LLM_AGENT", name: "LLM Node", critical: true, config: {} },
      { id: "n2", type: "HTTP_AGENT", name: "HTTP Node", critical: false, config: {} },
    ],
    edges: [{ id: "e1", source: "n1", target: "n2" }],
  },
  ...overrides,
});

export const mockRun = (overrides = {}) => ({
  id: "run-abc-123-def",
  status: "COMPLETED",
  startedAt: "2024-01-15T10:00:00Z",
  completedAt: "2024-01-15T10:00:45Z",
  output: { text: "Hello from the workflow" },
  error: null,
  workflow: mockWorkflow(),
  tasks: [
    {
      id: "t1",
      name: "LLM Node",
      status: "COMPLETED",
      startedAt: "2024-01-15T10:00:05Z",
      completedAt: "2024-01-15T10:00:40Z",
      input: { prompt: "hello" },
      output: { text: "world" },
      error: null,
      attempts: 1,
    },
    {
      id: "t2",
      name: "HTTP Node",
      status: "FAILED",
      startedAt: "2024-01-15T10:00:41Z",
      completedAt: "2024-01-15T10:00:44Z",
      input: { url: "https://api.example.com" },
      output: null,
      error: "Connection refused",
      attempts: 3,
    },
  ],
  ...overrides,
});

export const mockAgent = (overrides = {}) => ({
  id: "agent-1",
  name: "Test LLM Agent",
  type: "LLM_AGENT",
  status: "ONLINE",
  tasksHandled: 42,
  tasksFailed: 2,
  lastSeenAt: new Date(Date.now() - 30_000).toISOString(), // 30s ago
  ...overrides,
});

export const mockDashboardStats = () => ({
  totalWorkflows: 5,
  totalRuns: 128,
  successRate: 94,
  agentsOnline: 3,
});

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({}),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
