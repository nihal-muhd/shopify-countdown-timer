import { useMutation, useQuery, useQueryClient } from "react-query";

const TIMERS_QUERY_KEY = "timers";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function requestJson(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      responseBody.error || `Request failed with status ${response.status}`,
      response.status,
      responseBody.details ?? []
    );
  }
  return responseBody;
}

export function useTimers() {
  return useQuery(
    TIMERS_QUERY_KEY,
    async () => (await requestJson("/api/timers")).timers,
    { refetchOnWindowFocus: false }
  );
}

export function useTimer(timerId) {
  return useQuery(
    [TIMERS_QUERY_KEY, timerId],
    async () => (await requestJson(`/api/timers/${timerId}`)).timer,
    { enabled: Boolean(timerId), refetchOnWindowFocus: false, retry: false }
  );
}

export function useSaveTimer(timerId) {
  const queryClient = useQueryClient();
  return useMutation(
    async (timerInput) => {
      const path = timerId ? `/api/timers/${timerId}` : "/api/timers";
      const method = timerId ? "PUT" : "POST";
      return (await requestJson(path, { method, body: timerInput })).timer;
    },
    { onSuccess: () => queryClient.invalidateQueries(TIMERS_QUERY_KEY) }
  );
}

export function useDeleteTimer() {
  const queryClient = useQueryClient();
  return useMutation(
    (timerId) => requestJson(`/api/timers/${timerId}`, { method: "DELETE" }),
    { onSuccess: () => queryClient.invalidateQueries(TIMERS_QUERY_KEY) }
  );
}
