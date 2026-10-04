export type Severity = "High" | "Medium" | "Low";

export interface Opportunity {
  id: string;
  title: string;
  type: string;
  severity: Severity;
  confidence: number;
  detected: string;
  expected_kwh: number;
  actual_kwh: number;
  residual_kwh: number;
  avoidable_range: string;
  monthly_range: string;
  monthly_value: string;
  potential_kwh: number;
  priority_score: number;
  status: string;
  summary: string;
}

export interface SeriesPoint {
  label: string;
  expected: number;
  actual: number;
  anomaly?: boolean;
}

export interface Dashboard {
  building: { id: string; name: string; location: string; type: string };
  period: string;
  current_usage_kwh: number;
  expected_usage_kwh: number;
  variance_percent: number;
  potential_monthly_savings: number;
  priority_opportunities: Opportunity[];
  insight: { title: string; body: string; evidence: { occupancy_delta: number; hvac_delta: number; temperature_state: string; energy_delta: number; window: string } };
  data_quality: { completeness: number; missing_values: number; status: string };
}

export interface EnergyOverview {
  period: string;
  points: SeriesPoint[];
  context: { average_occupancy: number; average_temperature: number; hvac_runtime: string; peak_load: string; base_load: string };
}

export interface Detail extends Opportunity {
  what_happened: string;
  evidence: { label: string; value: string; tone: string }[];
  timeline: { start: string; end: string; recurrence: string };
  root_cause: { title: string; confidence: number; evidence: string[] };
  recommended_action: { title: string; savings_kwh: number; value: number; cost: number; payback: string; risk: string; confidence: number };
}

export interface Recommendation {
  id: string;
  action: string;
  energy_kwh: number;
  value: number;
  cost: number;
  payback: string;
  confidence: number;
  risk: string;
  opportunity_id: string;
  description: string;
}

export interface Simulation {
  baseline_kwh: number;
  scenario_kwh: number;
  energy_saved_kwh: number;
  cost_saved: number;
  co2e_avoided: number;
  operational_impact: string;
  assumptions: string[];
}

export interface Impact {
  total_energy_saved: number;
  cost_saved: number;
  co2e_avoided: number;
  interventions: number;
  successful_interventions: number;
  baseline_kwh: number;
  current_kwh: number;
  improvement_percent: number;
  projected: { energy_kwh: number; cost: number; co2e: number; interventions: number };
  confirmed: { energy_kwh: number; cost: number; co2e: number; interventions: number };
  timeline: { label: string; projected: number; confirmed: number }[];
}

export interface DataHealth {
  building: string;
  dataset: string;
  rows: number;
  time_range: string;
  completeness: number;
  missing_values: Record<string, number>;
  last_analysis: string;
  model: { version: string; mae: number; rmse: number; trained_at: string };
  uploads: { dataset: string; rows: number; time_range: string; completeness: number; status: string; uploaded_at: string }[];
}

