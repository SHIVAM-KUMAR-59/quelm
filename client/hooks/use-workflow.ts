import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getAllWorkflows = async () => {
  return await api.get("/api/workflow");
};

const getWorkflowById = async (id: string) => {
  return await api.get(`/api/workflow/${id}`);
};

const createWorkflow = async (data: {
  name: string;
  description?: string;
  definition: unknown;
}) => {
  return await api.post("/api/workflow", { data });
};

const triggerRun = async (id: string, input: Record<string, unknown>) => {
  return await api.post(`/api/workflow/${id}/run`, { data: { input } });
};

export const useWorkflows = () => {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: getAllWorkflows,
  });
};

export const useWorkflow = (id: string) => {
  return useQuery({
    queryKey: ["workflows", id],
    queryFn: () => getWorkflowById(id),
    enabled: !!id,
  });
};

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
};

export const useTriggerRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      triggerRun(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });
};
