import type { Dashboard, DataHealth, Detail, EnergyOverview, Impact, Opportunity, Recommendation, Simulation } from "./types";

export const dashboard: Dashboard = {
  building: { id: "orion-01", name: "Orion Business Center", location: "Bengaluru, IN", type: "Commercial office" }, period: "October 2026", current_usage_kwh: 48240, expected_usage_kwh: 43890, variance_percent: 9.9, potential_monthly_savings: 82400,
  priority_opportunities: [],
  insight: { title: "The evening schedule is the clearest intervention point.", body: "The largest energy deviation occurred between 7 PM and 10 PM. Occupancy fell 18% compared with the expected pattern while HVAC runtime remained unchanged.", evidence: { occupancy_delta: -18, hvac_delta: 1, temperature_state: "Normal", energy_delta: 16.8, window: "19:00–22:00" } }, data_quality: { completeness: 99.6, missing_values: 35, status: "Ready for analysis" },
};

export const opportunities: Opportunity[] = [
  { id: "after-hours-hvac", title: "After-hours HVAC", type: "after_hours_hvac", severity: "High", confidence: 92, detected: "Oct 03, 2026", expected_kwh: 184, actual_kwh: 215, residual_kwh: 31, avoidable_range: "24–31 kWh", monthly_range: "1,420–1,680 kWh", monthly_value: "₹18,000–₹21,000", potential_kwh: 1420, priority_score: 94, status: "Open", summary: "HVAC operation remained elevated after occupancy dropped below its expected evening pattern." },
  { id: "weekend-baseload", title: "Weekend baseload", type: "weekend_baseload", severity: "Medium", confidence: 86, detected: "Sep 27, 2026", expected_kwh: 156, actual_kwh: 174, residual_kwh: 18, avoidable_range: "14–19 kWh", monthly_range: "780–920 kWh", monthly_value: "₹10,000–₹11,800", potential_kwh: 780, priority_score: 82, status: "Open", summary: "Non-operating energy is recurring above the contextual baseline on recent weekends." },
  { id: "lighting-schedule", title: "Lighting schedule", type: "lighting_schedule", severity: "Low", confidence: 81, detected: "Sep 30, 2026", expected_kwh: 92, actual_kwh: 104, residual_kwh: 12, avoidable_range: "9–13 kWh", monthly_range: "310–420 kWh", monthly_value: "₹4,000–₹5,400", potential_kwh: 310, priority_score: 67, status: "Open", summary: "Lighting load continues for two hours after the operating window on three weekdays." },
  { id: "weather-spike", title: "Weather-driven spike", type: "weather_spike", severity: "Medium", confidence: 74, detected: "May 19, 2026", expected_kwh: 204, actual_kwh: 230, residual_kwh: 26, avoidable_range: "6–12 kWh", monthly_range: "120–220 kWh", monthly_value: "₹1,500–₹2,800", potential_kwh: 120, priority_score: 48, status: "Monitor", summary: "A short temperature excursion increased cooling demand beyond the learned range." },
  { id: "monday-inefficiency", title: "Monday reset pattern", type: "recurring_behavior", severity: "Low", confidence: 79, detected: "Oct 01, 2026", expected_kwh: 143, actual_kwh: 157, residual_kwh: 14, avoidable_range: "10–15 kWh", monthly_range: "240–360 kWh", monthly_value: "₹3,100–₹4,600", potential_kwh: 240, priority_score: 44, status: "Monitor", summary: "A repeatable Monday evening pattern suggests schedules are not being reset consistently." },
];
dashboard.priority_opportunities = opportunities.slice(0, 3);

export function series(period = "7D"): EnergyOverview { const count = period === "24H" ? 24 : period === "7D" ? 14 : 30; return { period, points: Array.from({ length: count }, (_, index) => { const hour = (index * 2 + 7) % 24; const expected = 155 + 35 * Math.sin((hour - 6) / 24 * Math.PI * 2) + (index % 5) * 3; return { label: period === "24H" ? `${String(hour).padStart(2, "0")}:00` : `Oct ${String(index + 1).padStart(2, "0")}`, expected: Math.round(expected), actual: Math.round(expected + (index === 8 || index === 9 ? 21 : 4 + (index % 3) * 2)), anomaly: (index === 8 || index === 9) && (period === "24H" || period === "7D") }; }), context: { average_occupancy: 58, average_temperature: 27.4, hvac_runtime: "6.8 h/day", peak_load: "412 kW", base_load: "118 kW" } }; }

export const details: Record<string, Detail> = {
  "after-hours-hvac": {
    ...opportunities[0],
    what_happened: "Energy stayed above the contextual baseline after occupancy had already fallen, creating an avoidable evening load.",
    evidence: [
      { label: "Occupancy", value: "↓ 18%", tone: "positive" },
      { label: "HVAC runtime", value: "→ unchanged", tone: "neutral" },
      { label: "Temperature", value: "→ normal", tone: "neutral" },
      { label: "Energy consumption", value: "↑ 16.8%", tone: "warning" },
    ],
    timeline: { start: "19:00", end: "22:00", recurrence: "4 of last 5 weekdays" },
    root_cause: {
      title: "HVAC schedule mismatch",
      confidence: 92,
      evidence: [
        "Occupancy was 18% below the expected evening pattern",
        "HVAC runtime remained unchanged",
        "Temperature remained within the normal operating range",
        "Similar deviations occurred on the previous three weekdays",
      ],
    },
    recommended_action: {
      title: "Reduce HVAC operation by 45 minutes during the evening window.",
      savings_kwh: 1420,
      value: 18460,
      cost: 0,
      payback: "Immediate",
      risk: "Low",
      confidence: 92,
    },
  },
  "weekend-baseload": {
    ...opportunities[1],
    what_happened: "Non-operating energy is recurring above the contextual baseline on recent weekends, drawing 18 kWh/hr above idle conditions.",
    evidence: [
      { label: "Occupancy", value: "↓ 0% (unoccupied)", tone: "positive" },
      { label: "Weekend load", value: "↑ 11.5%", tone: "warning" },
      { label: "Temperature", value: "→ normal", tone: "neutral" },
      { label: "Residual energy", value: "+18 kWh/hr", tone: "warning" },
    ],
    timeline: { start: "09:00", end: "16:00", recurrence: "Recent weekends (Jul–Oct)" },
    root_cause: {
      title: "Unshifted weekend non-critical loads",
      confidence: 86,
      evidence: [
        "Zero occupancy recorded across 8 weekend intervals",
        "Chilled water loop pressure remained at weekday operating setpoint",
        "Non-critical loads were left scheduled during peak hours",
        "Load profile consistent across recent weekend cycles",
      ],
    },
    recommended_action: {
      title: "Shift non-critical weekend load into the operating window.",
      savings_kwh: 780,
      value: 10140,
      cost: 0,
      payback: "Immediate",
      risk: "Low",
      confidence: 86,
    },
  },
  "lighting-schedule": {
    ...opportunities[2],
    what_happened: "Lighting load continues for two hours after the operating window on three weekdays without occupant trigger.",
    evidence: [
      { label: "Occupancy", value: "↓ 2% (after-hours)", tone: "positive" },
      { label: "Lighting circuits", value: "↑ 13.0%", tone: "warning" },
      { label: "Schedule overrun", value: "+2.0 hrs", tone: "warning" },
      { label: "Residual energy", value: "+12 kWh/hr", tone: "warning" },
    ],
    timeline: { start: "19:00", end: "21:00", recurrence: "Mondays, Wednesdays & Fridays" },
    root_cause: {
      title: "Lighting timer override lingering",
      confidence: 81,
      evidence: [
        "Sweep timer set to 21:00 instead of 19:20",
        "No occupancy sensor motion detected post-19:15",
        "Circuit telemetry shows full floor illumination active",
        "Corresponds to janitorial override not returning to auto-mode",
      ],
    },
    recommended_action: {
      title: "Stop lighting circuits 20 minutes after the operating window.",
      savings_kwh: 310,
      value: 4030,
      cost: 0,
      payback: "Immediate",
      risk: "Low",
      confidence: 81,
    },
  },
  "weather-spike": {
    ...opportunities[3],
    what_happened: "A short temperature excursion increased cooling demand beyond the learned range, revealing rooftop unit efficiency degradation.",
    evidence: [
      { label: "Ambient temp", value: "↑ 31.4°C (+4°C spike)", tone: "warning" },
      { label: "RTU power draw", value: "↑ 24.2%", tone: "warning" },
      { label: "Indoor setpoint", value: "→ 23.5°C", tone: "neutral" },
      { label: "Residual energy", value: "+26 kWh/hr", tone: "warning" },
    ],
    timeline: { start: "13:00", end: "16:00", recurrence: "May 19, 2026 (weather excursion)" },
    root_cause: {
      title: "Legacy rooftop unit compressor degradation",
      confidence: 74,
      evidence: [
        "Excursion pushed unit into maximum compressor staging",
        "COP degraded by 28% under high ambient conditions",
        "Refrigerant pressure logs suggest coil fouling",
        "Thermal comfort maintained but at disproportionate kWh cost",
      ],
    },
    recommended_action: {
      title: "Replace legacy rooftop unit with high-efficiency variable-speed unit.",
      savings_kwh: 3100,
      value: 40300,
      cost: 84000,
      payback: "11 months",
      risk: "Medium",
      confidence: 78,
    },
  },
  "monday-inefficiency": {
    ...opportunities[4],
    what_happened: "A repeatable Monday evening pattern suggests setback schedules are not being reset consistently after weekend shutdowns.",
    evidence: [
      { label: "Monday occupancy", value: "↓ 12% (evening)", tone: "positive" },
      { label: "HVAC rampdown", value: "→ delayed 1.5 hrs", tone: "warning" },
      { label: "Setpoint status", value: "Manual hold", tone: "warning" },
      { label: "Residual energy", value: "+14 kWh/hr", tone: "warning" },
    ],
    timeline: { start: "18:00", end: "20:00", recurrence: "Every Monday evening" },
    root_cause: {
      title: "Manual setpoint override retention",
      confidence: 79,
      evidence: [
        "Morning pre-cool override flag remains set into evening",
        "BMS schedule logic fails to clear manual override automatically",
        "Identical deviation observed across 4 consecutive Mondays",
        "Simple BMS schedule reset logic prevents recurrence entirely",
      ],
    },
    recommended_action: {
      title: "Automate Monday BMS override clearing at 18:00.",
      savings_kwh: 240,
      value: 3120,
      cost: 0,
      payback: "Immediate",
      risk: "Low",
      confidence: 79,
    },
  },
};

export const recommendations: Recommendation[] = [
  { id: "reduce-hvac-window", action: "Reduce HVAC operating window", energy_kwh: 1420, value: 18460, cost: 0, payback: "Immediate", confidence: 92, risk: "Low", opportunity_id: "after-hours-hvac", description: "End evening HVAC 45 minutes earlier on weekdays." },
  { id: "shift-load-b", action: "Shift Load B", energy_kwh: 780, value: 10140, cost: 0, payback: "Immediate", confidence: 86, risk: "Low", opportunity_id: "weekend-baseload", description: "Move non-critical weekend load into the operating window." },
  { id: "lighting-schedule", action: "Tighten lighting schedule", energy_kwh: 310, value: 4030, cost: 0, payback: "Immediate", confidence: 81, risk: "Low", opportunity_id: "lighting-schedule", description: "Stop lighting circuits 20 minutes after the operating window." },
  { id: "equipment-replacement", action: "Replace legacy rooftop unit", energy_kwh: 3100, value: 40300, cost: 84000, payback: "11 months", confidence: 78, risk: "Medium", opportunity_id: "weather-spike", description: "Replace the highest-load unit after a scoped maintenance review." },
];

export const impact: Impact = { total_energy_saved: 12480, cost_saved: 184200, co2e_avoided: 9.7, interventions: 14, successful_interventions: 11, baseline_kwh: 48200, current_kwh: 43900, improvement_percent: 8.9, projected: { energy_kwh: 12480, cost: 184200, co2e: 9.7, interventions: 14 }, confirmed: { energy_kwh: 9380, cost: 121940, co2e: 6.7, interventions: 11 }, timeline: [{ label: "Jul", projected: 2400, confirmed: 1800 }, { label: "Aug", projected: 3100, confirmed: 2400 }, { label: "Sep", projected: 3300, confirmed: 2800 }, { label: "Oct", projected: 3680, confirmed: 2380 }] };

export const dataHealth: DataHealth = { building: "Orion Business Center", dataset: "Orion Business Center Energy 2026", rows: 8760, time_range: "Jan 1 → Dec 31, 2026", completeness: 99.6, missing_values: { timestamp: 0, energy_kwh: 0, occupancy: 17, temperature: 8, humidity: 10 }, last_analysis: "Oct 03, 2026 at 09:42", model: { version: "contextual-baseline-v0.1", mae: 4.8, rmse: 7.2, trained_at: "Oct 03, 2026" }, uploads: [{ dataset: "Orion Business Center Energy 2026", rows: 8760, time_range: "Jan 1 → Dec 31, 2026", completeness: 99.6, status: "Ready for analysis", uploaded_at: "2026-10-03 09:42" }] };

export const defaultSimulation: Simulation = { baseline_kwh: 48240, scenario_kwh: 45910, energy_saved_kwh: 2330, cost_saved: 30290, co2e_avoided: 1.65, operational_impact: "Low", assumptions: ["Tariff ₹13/kWh", "Grid factor 0.71 kgCO₂e/kWh", "Scenario is isolated from source readings"] };

