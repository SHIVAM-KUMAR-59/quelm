import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name?: string;
  email: string;
  password: string;
};

type RefreshPayload = {
  token: string;
};

const registerUser = async (data: RegisterPayload) => {
  const response = await api.post("/auth/register", data);

  return response.data;
};

const loginUser = async (data: LoginPayload) => {
  const response = await api.post("/auth/login", data);

  return response.data;
};

const refreshToken = async (data: RefreshPayload) => {
  const response = await api.post("/auth/token/refresh", data);

  return response.data;
};

const logoutUser = async (token: string) => {
  const response = await api.post("/auth/logout", {
    token,
  });

  return response.data;
};

const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: loginUser,
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: refreshToken,
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: logoutUser,
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });
};
