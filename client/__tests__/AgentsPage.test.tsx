/**
 * Tests for app/(dashboard)/agents/page.tsx
 *
 * Covers:
 *   - Loading skeleton (grid of pulse cards)
 *   - Error state
 *   - Empty state with Browse Workflows link
 *   - Populated state: agent name, type display, status badge, metrics
 *   - Success rate calculation (handles 0 tasks edge case)
 *   - formatLastSeen relative time display
 *   - BUSY status shows "Processing" label
 *   - OFFLINE status shows "Inactive" label
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, mockAgent } from "./helpers";
import AgentsPage from "../app/(dashboard)/agents/page";

// ---------------------------------------------------------------------------
// Mock hook
// ---------------------------------------------------------------------------
const mockUseAgents = vi.fn();

vi.mock("@/hooks/use-agent", () => ({
  useAgents: () => mockUseAgents(),
}));

vi.mock("@/components/ui/ErrorState", () => ({
  default: ({ title }: { title: string }) => <div data-testid="error-state">{title}</div>,
}));

describe("AgentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Loading ---

  it("renders loading skeleton grid when isLoading is true", () => {
    mockUseAgents.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    const { container } = render(<AgentsPage />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  // --- Error ---

  it("renders ErrorState when hook returns an error", () => {
    mockUseAgents.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Network timeout"),
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByTestId("error-state")).toHaveTextContent("Failed to load agents");
  });

  // --- Empty state ---

  it("renders 'No agents registered' when agents list is empty", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("No agents registered")).toBeInTheDocument();
  });

  it("renders Browse Workflows link in empty state", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByRole("link", { name: /browse workflows/i })).toHaveAttribute(
      "href",
      "/workflows",
    );
  });

  // --- Agent card content ---

  it("renders agent name", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ name: "My LLM Worker" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("My LLM Worker")).toBeInTheDocument();
  });

  it("renders agent type with underscores replaced by spaces", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ type: "LLM_AGENT" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("LLM AGENT")).toBeInTheDocument();
  });

  it("renders Tasks Handled count", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ tasksHandled: 99 })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("renders Failed Tasks count", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ tasksFailed: 7 })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("calculates and renders success rate correctly", () => {
    mockUseAgents.mockReturnValue({
      data: {
        data: [mockAgent({ tasksHandled: 100, tasksFailed: 10 })],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("renders '—' for success rate when tasksHandled is 0", () => {
    mockUseAgents.mockReturnValue({
      data: {
        data: [mockAgent({ tasksHandled: 0, tasksFailed: 0 })],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // --- Status badges ---

  it("renders ONLINE status badge", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ status: "ONLINE" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("ONLINE")).toBeInTheDocument();
  });

  it("renders 'Active' footer label for ONLINE agent", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ status: "ONLINE" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders 'Processing' footer label for BUSY agent", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ status: "BUSY" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });

  it("renders 'Inactive' footer label for OFFLINE agent", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ status: "OFFLINE" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  // --- formatLastSeen ---

  it("shows seconds ago for a very recent lastSeenAt", () => {
    const recentDate = new Date(Date.now() - 10_000).toISOString(); // 10s ago
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ lastSeenAt: recentDate })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText(/\ds ago/)).toBeInTheDocument();
  });

  it("shows minutes ago for a moderately recent lastSeenAt", () => {
    const recentDate = new Date(Date.now() - 5 * 60_000).toISOString(); // 5m ago
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ lastSeenAt: recentDate })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText(/5m ago/)).toBeInTheDocument();
  });

  it("shows 'Unknown' when lastSeenAt is null", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [mockAgent({ lastSeenAt: null })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  // --- Multiple agents ---

  it("renders a card for each agent", () => {
    mockUseAgents.mockReturnValue({
      data: {
        data: [
          mockAgent({ id: "a1", name: "Worker Alpha" }),
          mockAgent({ id: "a2", name: "Worker Beta" }),
          mockAgent({ id: "a3", name: "Worker Gamma" }),
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByText("Worker Alpha")).toBeInTheDocument();
    expect(screen.getByText("Worker Beta")).toBeInTheDocument();
    expect(screen.getByText("Worker Gamma")).toBeInTheDocument();
  });

  // --- Page header ---

  it("renders the Agent Cluster heading", () => {
    mockUseAgents.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AgentsPage />);
    expect(screen.getByRole("heading", { name: /agent cluster/i })).toBeInTheDocument();
  });
});
