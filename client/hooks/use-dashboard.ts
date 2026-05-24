import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const getDashboardStats = async () => {
  return await api.get("/api/dashboard/stats");
};

const getRecentRuns = async () => {
  return await api.get("/api/dashboard/recent-runs");
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // auto-refresh every 30 seconds
  });
};

export const useRecentRuns = () => {
  return useQuery({
    queryKey: ["dashboard", "recent-runs"],
    queryFn: getRecentRuns,
    refetchInterval: 30000,
  });
};
