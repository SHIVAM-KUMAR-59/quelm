export type RecentRun = {
  id: string;
  workflowName: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  startedAt: string;
  completedAt: string | null;
  taskCount: number;
  duration: number | null;
};
