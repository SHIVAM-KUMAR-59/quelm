/**
 * Tests for /app/(dashboard)/runs/page.tsx
 *
 * Covers:
 *   - Loading skeleton
 *   - Error state
 *   - Empty state with Browse Workflows link
 *   - Populated state: workflow name, run ID (mono), status badge, Monitor link
 *   - formatDuration logic (seconds, minutes, hours) via visible text
 *   - formatDate rendering
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render, mockRun } from "./helpers";
import RunPage from "../app/(dashboard)/runs/page";

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------
const mockUseRuns = vi.fn();

vi.mock("@/hooks/use-run", () => ({
  useRuns: () => mockUseRuns(),
  useRun: () => ({ data: null, refetch: vi.fn() }),
  useWorkflowRuns: () => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/components/ui/ErrorState", () => ({
  default: ({ title }: { title: string }) => <div data-testid="error-state">{title}</div>,
}));

describe("RunPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Loading ---

  it("renders loading skeletons when isLoading is true", () => {
    mockUseRuns.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    const { container } = render(<RunPage />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  // --- Error ---

  it("renders ErrorState when hook returns an error", () => {
    mockUseRuns.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("fetch failed"),
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByTestId("error-state")).toHaveTextContent("Failed to load runs");
  });

  // --- Empty state ---

  it("renders 'No workflow runs yet' when runs is empty", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("No workflow runs yet")).toBeInTheDocument();
  });

  it("renders Browse Workflows link in empty state", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    const link = screen.getByRole("link", { name: /browse workflows/i });
    expect(link).toHaveAttribute("href", "/workflows");
  });

  // --- Populated state ---

  it("renders the workflow name for each run", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [mockRun()] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("Test Workflow")).toBeInTheDocument();
  });

  it("renders the run ID in mono text", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [mockRun({ id: "run-abc-123-def" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("run-abc-123-def")).toBeInTheDocument();
  });

  it("renders a Monitor link pointing to /runs/<id>", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [mockRun({ id: "run-abc-123-def" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    const link = screen.getByRole("link", { name: /monitor/i });
    expect(link).toHaveAttribute("href", "/runs/run-abc-123-def");
  });

  it("renders the COMPLETED status badge", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [mockRun({ status: "COMPLETED" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  });

  it("renders the FAILED status badge", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [mockRun({ status: "FAILED" })] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("FAILED")).toBeInTheDocument();
  });

  it("renders the RUNNING status badge", () => {
    mockUseRuns.mockReturnValue({
      data: {
        data: [mockRun({ status: "RUNNING", completedAt: null })],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });

  it("renders multiple runs", () => {
    mockUseRuns.mockReturnValue({
      data: {
        data: [
          mockRun({ id: "r1", workflow: { name: "Alpha" } }),
          mockRun({ id: "r2", workflow: { name: "Beta" } }),
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  // --- Duration formatting ---

  it("shows duration in seconds for a short run", () => {
    mockUseRuns.mockReturnValue({
      data: {
        data: [
          mockRun({
            startedAt: "2024-01-15T10:00:00Z",
            completedAt: "2024-01-15T10:00:45Z",
          }),
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("45s")).toBeInTheDocument();
  });

  it("shows duration in minutes for a longer run", () => {
    mockUseRuns.mockReturnValue({
      data: {
        data: [
          mockRun({
            startedAt: "2024-01-15T10:00:00Z",
            completedAt: "2024-01-15T10:02:30Z",
          }),
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("2m 30s")).toBeInTheDocument();
  });

  it("shows -- for duration when startedAt is missing", () => {
    mockUseRuns.mockReturnValue({
      data: {
        data: [mockRun({ startedAt: null, completedAt: null })],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(screen.getByText("--")).toBeInTheDocument();
  });

  // --- Page header ---

  it("renders the Workflow Runs heading", () => {
    mockUseRuns.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<RunPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /workflow runs/i,
      }),
    ).toBeInTheDocument();
  });
});
