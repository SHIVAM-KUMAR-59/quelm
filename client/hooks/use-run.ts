import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const getAllRuns = async () => {
  return await api.get("/api/runs");
};

const getRunById = async (id: string) => {
  return await api.get(`/api/runs/${id}`);
};

const getRunsByWorkflowId = async (id: string) => {
  return await api.get(`/api/runs/workflow/${id}`);
};

export const useRuns = () => {
  return useQuery({
    queryKey: ["runs"],
    queryFn: getAllRuns,
  });
};

export const useRun = (id: string) => {
  return useQuery({
    queryKey: ["runs", id],
    queryFn: () => getRunById(id),
    enabled: !!id,
  });
};

export const useWorkflowRuns = (id: string) => {
  return useQuery({
    queryKey: ["runs", "workflow", id],
    queryFn: () => getRunsByWorkflowId(id),
    enabled: !!id,
  });
};
