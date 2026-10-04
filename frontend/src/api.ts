import { dashboard, dataHealth, defaultSimulation, details, impact, opportunities, recommendations, series } from "./data";
import type { Dashboard, DataHealth, Detail, EnergyOverview, Impact, Opportunity, Recommendation, Simulation } from "./types";

// In development Vite proxies /api to FastAPI, avoiding localhost/127.0.0.1
// hostname differences and keeping browser requests same-origin.
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json() as T;
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error("ResourceOps API is unavailable");
  }
}

export const api = {
  dashboard: () => request<Dashboard>("/dashboard", undefined, dashboard),
  energy: (period: string) => request<EnergyOverview>(`/energy/series?period=${period}`, undefined, series(period)),
  opportunities: () => request<Opportunity[]>("/opportunities", undefined, opportunities),
  detail: (id: string) => request<Detail>(`/opportunities/${id}`, undefined, details[id] ?? details["after-hours-hvac"]),
  recommendations: () => request<Recommendation[]>("/recommendations", undefined, recommendations),
  impact: () => request<Impact>("/impact", undefined, impact),
  health: () => request<DataHealth>("/data/health", undefined, dataHealth),
  simulate: (params: { hvac_minutes: number; lighting_minutes: number; load_shift_hours: number; occupancy_delta: number }) => request<Simulation>("/simulations", { method: "POST", body: JSON.stringify(params) }, defaultSimulation),
  upload: async (file: File) => { const form = new FormData(); form.append("file", file); try { const response = await fetch(`${API_URL}/data/upload`, { method: "POST", body: form }); if (!response.ok) throw new Error("Upload failed"); return await response.json(); } catch { return { filename: file.name, valid: false, rows: 0, missing_columns: ["Backend unavailable — run the API to validate this file"], invalid_timestamps: 0, message: "The local prototype could not reach the API. Your file has not been imported." }; } },
};
