import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const getAllAgents = async () => {
  return await api.get("/api/agents");
};

const getAgentById = async (id: string) => {
  return await api.get(`/api/agents/${id}`);
};

export const useAgents = () => {
  return useQuery({
    queryKey: ["agents"],
    queryFn: getAllAgents,
  });
};

export const useAgent = (id: string) => {
  return useQuery({
    queryKey: ["agents", id],
    queryFn: () => getAgentById(id),
    enabled: !!id,
  });
};
