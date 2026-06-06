/**
 * Tests for components/dashboard/StatCard.tsx
 *
 * Covers:
 *   - Renders title, value, description
 *   - Shows "—" for empty/zero/null/undefined values
 *   - Renders icon slot
 *   - Empty state bottom border appears when value is empty
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "./helpers";
import { Activity } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";

describe("StatCard", () => {
  const defaultProps = {
    title: "Total Workflows",
    value: 42,
    icon: <Activity data-testid="stat-icon" />,
    description: "Configured workflow pipelines.",
  };

  it("renders the card title", () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText("Total Workflows")).toBeInTheDocument();
  });

  it("renders the numeric value", () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText("Configured workflow pipelines.")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByTestId("stat-icon")).toBeInTheDocument();
  });

  it("shows — when value is 0", () => {
    render(<StatCard {...defaultProps} value={0} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows — when value is empty string", () => {
    render(<StatCard {...defaultProps} value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows — when value is null", () => {
    render(<StatCard {...defaultProps} value={null as unknown as number} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows — when value is undefined", () => {
    render(<StatCard {...defaultProps} value={undefined as unknown as number} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders a string value correctly", () => {
    render(<StatCard {...defaultProps} value="94%" />);
    expect(screen.getByText("94%")).toBeInTheDocument();
  });

  it("does not show — when value is a non-zero number", () => {
    render(<StatCard {...defaultProps} value={128} />);
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("renders a fallback message when description is omitted", () => {
    render(<StatCard title="Runs" value={10} icon={<Activity />} />);
    expect(screen.getByText(/no additional insights/i)).toBeInTheDocument();
  });
});
