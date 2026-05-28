import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    if (status === 401) {
      window.location.href = "/auth/login?error=unauthorized";
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    return Promise.reject(new Error(message));
  },
);

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof AxiosError) {
    return err.response?.data?.message ?? err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Unknown error";
};
