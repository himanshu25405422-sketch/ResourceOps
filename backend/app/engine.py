"""Deterministic ResourceOps demo intelligence engine.

The prototype keeps numerical work here rather than in the API layer. The
same engine powers the FastAPI routes and makes simulations reproducible.
"""

from __future__ import annotations

import csv
import io
import math
import random
from datetime import datetime, timedelta
from typing import Any


REQUIRED_COLUMNS = {
    "timestamp",
    "energy_kwh",
    "occupancy",
    "temperature",
    "humidity",
    "hvac_runtime",
    "operating_hour",
    "weekday",
    "month",
    "holiday",
}


def _round(value: float, digits: int = 1) -> float:
    return round(value, digits)


def _is_holiday(day: datetime) -> bool:
    return day.strftime("%m-%d") in {"01-26", "08-15", "10-02", "12-25"}


def contextual_expected(
    occupancy: float,
    temperature: float,
    humidity: float,
    hvac_runtime: float,
    hour: int,
    weekday: int,
    holiday: bool,
) -> float:
    """Explainable contextual baseline, intentionally free of random state."""
    operating = 1 if 8 <= hour < 19 and weekday < 5 and not holiday else 0
    base = 112 + occupancy * 0.22
    schedule = 38 if operating else 19
    weather = max(0.0, abs(temperature - 23) * 2.4) + max(0.0, humidity - 58) * 0.18
    hvac = hvac_runtime * 52
    hour_shape = 8 * math.sin((hour - 7) / 24 * math.pi * 2) + 8
    weekend_adjustment = -7 if weekday >= 5 else 0
    return max(80, base + schedule + weather + hvac + hour_shape + weekend_adjustment)


def generate_readings() -> list[dict[str, Any]]:
    """Generate 8,760 realistic hourly rows for Orion Business Center."""
    rng = random.Random(20261003)
    start = datetime(2026, 1, 1)
    rows: list[dict[str, Any]] = []
    for index in range(8760):
        timestamp = start + timedelta(hours=index)
        hour = timestamp.hour
        weekday = timestamp.weekday()
        holiday = _is_holiday(timestamp)
        seasonal = 6 * math.sin((timestamp.timetuple().tm_yday - 35) / 365 * math.pi * 2)
        daily_temperature = 4 * math.sin((hour - 6) / 24 * math.pi * 2)
        temperature = 27 + seasonal + daily_temperature + rng.gauss(0, 0.7)
        humidity = max(35, min(82, 57 - daily_temperature * 1.5 + rng.gauss(0, 3)))
        operating = 8 <= hour < 19 and weekday < 5 and not holiday
        occupancy_target = 0 if not operating else 62 + 13 * math.sin((hour - 8) / 11 * math.pi)
        occupancy = max(0, min(98, occupancy_target + rng.gauss(0, 4)))
        hvac_runtime = (0.84 if operating else 0.12) + max(0, abs(temperature - 23) * 0.016)
        expected = contextual_expected(occupancy, temperature, humidity, hvac_runtime, hour, weekday, holiday)
        energy = expected + rng.gauss(0, 5)

        # Scenario A: after-hours HVAC on the golden-demo date.
        if timestamp.date().isoformat() == "2026-10-03" and 19 <= hour <= 22:
            occupancy = max(2, occupancy * 0.82)
            hvac_runtime = 0.86
            energy += 31
        # Scenario B: recurring weekend baseload.
        if weekday >= 5 and 9 <= hour <= 16 and timestamp.month in {7, 8, 9, 10}:
            energy += 18
        # Scenario C: lighting remains active after close on selected weekdays.
        if weekday in {0, 2, 4} and 19 <= hour <= 21:
            energy += 12
        # Scenario D: weather-driven spike.
        if timestamp.date().isoformat() == "2026-05-19" and 13 <= hour <= 16:
            temperature += 4
            energy += 26
        # Scenario E: repeatable Monday evening inefficiency.
        if weekday == 0 and 18 <= hour <= 20:
            energy += 14

        rows.append(
            {
                "timestamp": timestamp.isoformat(timespec="minutes"),
                "energy_kwh": _round(max(0, energy)),
                "occupancy": _round(occupancy),
                "temperature": _round(temperature),
                "humidity": _round(humidity),
                "hvac_runtime": _round(hvac_runtime, 3),
                "operating_hour": operating,
                "weekday": weekday,
                "month": timestamp.month,
                "holiday": holiday,
            }
        )
    return rows


class ResourceOpsEngine:
    def __init__(self) -> None:
        self.rows = generate_readings()
        self.model_version = "contextual-baseline-v0.1"
        self.upload_history: list[dict[str, Any]] = [
            {
                "dataset": "Orion Business Center Energy 2026",
                "rows": 8760,
                "time_range": "Jan 1 → Dec 31, 2026",
                "completeness": 99.6,
                "status": "Ready for analysis",
                "uploaded_at": "2026-10-03 09:42",
            }
        ]

    @property
    def opportunities(self) -> list[dict[str, Any]]:
        return [
            {
                "id": "after-hours-hvac",
                "title": "After-hours HVAC",
                "type": "after_hours_hvac",
                "severity": "High",
                "confidence": 92,
                "detected": "Oct 03, 2026",
                "expected_kwh": 184,
                "actual_kwh": 215,
                "residual_kwh": 31,
                "avoidable_range": "24–31 kWh",
                "monthly_range": "1,420–1,680 kWh",
                "monthly_value": "₹18,000–₹21,000",
                "potential_kwh": 1420,
                "priority_score": 94,
                "status": "Open",
                "summary": "HVAC operation remained elevated after occupancy dropped below its expected evening pattern.",
            },
            {
                "id": "weekend-baseload",
                "title": "Weekend baseload",
                "type": "weekend_baseload",
                "severity": "Medium",
                "confidence": 86,
                "detected": "Sep 27, 2026",
                "expected_kwh": 156,
                "actual_kwh": 174,
                "residual_kwh": 18,
                "avoidable_range": "14–19 kWh",
                "monthly_range": "780–920 kWh",
                "monthly_value": "₹10,000–₹11,800",
                "potential_kwh": 780,
                "priority_score": 82,
                "status": "Open",
                "summary": "Non-operating energy is recurring above the contextual baseline on recent weekends.",
            },
            {
                "id": "lighting-schedule",
                "title": "Lighting schedule",
                "type": "lighting_schedule",
                "severity": "Low",
                "confidence": 81,
                "detected": "Sep 30, 2026",
                "expected_kwh": 92,
                "actual_kwh": 104,
                "residual_kwh": 12,
                "avoidable_range": "9–13 kWh",
                "monthly_range": "310–420 kWh",
                "monthly_value": "₹4,000–₹5,400",
                "potential_kwh": 310,
                "priority_score": 67,
                "status": "Open",
                "summary": "Lighting load continues for two hours after the operating window on three weekdays.",
            },
            {
                "id": "weather-spike",
                "title": "Weather-driven spike",
                "type": "weather_spike",
                "severity": "Medium",
                "confidence": 74,
                "detected": "May 19, 2026",
                "expected_kwh": 204,
                "actual_kwh": 230,
                "residual_kwh": 26,
                "avoidable_range": "6–12 kWh",
                "monthly_range": "120–220 kWh",
                "monthly_value": "₹1,500–₹2,800",
                "potential_kwh": 120,
                "priority_score": 48,
                "status": "Monitor",
                "summary": "A short temperature excursion increased cooling demand beyond the learned range.",
            },
            {
                "id": "monday-inefficiency",
                "title": "Monday reset pattern",
                "type": "recurring_behavior",
                "severity": "Low",
                "confidence": 79,
                "detected": "Oct 01, 2026",
                "expected_kwh": 143,
                "actual_kwh": 157,
                "residual_kwh": 14,
                "avoidable_range": "10–15 kWh",
                "monthly_range": "240–360 kWh",
                "monthly_value": "₹3,100–₹4,600",
                "potential_kwh": 240,
                "priority_score": 44,
                "status": "Monitor",
                "summary": "A repeatable Monday evening pattern suggests schedules are not being reset consistently.",
            },
        ]

    @property
    def recommendations(self) -> list[dict[str, Any]]:
        return [
            {"id": "reduce-hvac-window", "action": "Reduce HVAC operating window", "energy_kwh": 1420, "value": 18460, "cost": 0, "payback": "Immediate", "confidence": 92, "risk": "Low", "opportunity_id": "after-hours-hvac", "description": "End evening HVAC 45 minutes earlier on weekdays."},
            {"id": "shift-load-b", "action": "Shift Load B", "energy_kwh": 780, "value": 10140, "cost": 0, "payback": "Immediate", "confidence": 86, "risk": "Low", "opportunity_id": "weekend-baseload", "description": "Move non-critical weekend load into the operating window."},
            {"id": "lighting-schedule", "action": "Tighten lighting schedule", "energy_kwh": 310, "value": 4030, "cost": 0, "payback": "Immediate", "confidence": 81, "risk": "Low", "opportunity_id": "lighting-schedule", "description": "Stop lighting circuits 20 minutes after the operating window."},
            {"id": "equipment-replacement", "action": "Replace legacy rooftop unit", "energy_kwh": 3100, "value": 40300, "cost": 84000, "payback": "11 months", "confidence": 78, "risk": "Medium", "opportunity_id": "weather-spike", "description": "Replace the highest-load unit after a scoped maintenance review."},
        ]

    def dashboard(self) -> dict[str, Any]:
        return {
            "building": {"id": "orion-01", "name": "Orion Business Center", "location": "Bengaluru, IN", "type": "Commercial office"},
            "period": "October 2026",
            "current_usage_kwh": 48240,
            "expected_usage_kwh": 43890,
            "variance_percent": 9.9,
            "potential_monthly_savings": 82400,
            "priority_opportunities": self.opportunities[:3],
            "insight": {
                "title": "The evening schedule is the clearest intervention point.",
                "body": "The largest energy deviation occurred between 7 PM and 10 PM. Occupancy fell 18% compared with the expected pattern while HVAC runtime remained unchanged.",
                "evidence": {"occupancy_delta": -18, "hvac_delta": 1, "temperature_state": "Normal", "energy_delta": 16.8, "window": "19:00–22:00"},
            },
            "data_quality": {"completeness": 99.6, "missing_values": 35, "status": "Ready for analysis"},
        }

    def energy_series(self, period: str = "7D") -> dict[str, Any]:
        count = {"24H": 24, "7D": 14, "30D": 30, "90D": 30, "1Y": 30}.get(period, 14)
        points = []
        for index in range(count):
            hour = (index * 2 + 7) % 24
            expected = 155 + 35 * math.sin((hour - 6) / 24 * math.pi * 2) + (index % 5) * 3
            actual = expected + (21 if index in {8, 9} and period in {"24H", "7D"} else 4 + (index % 3) * 2)
            points.append({"label": f"{hour:02d}:00" if period == "24H" else f"Oct {index + 1:02d}", "expected": _round(expected), "actual": _round(actual), "anomaly": index in {8, 9} and period in {"24H", "7D"}})
        return {"period": period, "points": points, "context": {"average_occupancy": 58, "average_temperature": 27.4, "hvac_runtime": "6.8 h/day", "peak_load": "412 kW", "base_load": "118 kW"}}

    def opportunity_detail(self, opportunity_id: str) -> dict[str, Any]:
        opportunity = next((item for item in self.opportunities if item["id"] == opportunity_id), self.opportunities[0])
        details_map: dict[str, dict[str, Any]] = {
            "after-hours-hvac": {
                "what_happened": "Energy stayed above the contextual baseline after occupancy had already fallen, creating an avoidable evening load.",
                "evidence": [
                    {"label": "Occupancy", "value": "↓ 18%", "tone": "positive"},
                    {"label": "HVAC runtime", "value": "→ unchanged", "tone": "neutral"},
                    {"label": "Temperature", "value": "→ normal", "tone": "neutral"},
                    {"label": "Energy consumption", "value": "↑ 16.8%", "tone": "warning"},
                ],
                "timeline": {"start": "19:00", "end": "22:00", "recurrence": "4 of last 5 weekdays"},
                "root_cause": {
                    "title": "HVAC schedule mismatch",
                    "confidence": 92,
                    "evidence": [
                        "Occupancy was 18% below the expected evening pattern",
                        "HVAC runtime remained unchanged",
                        "Temperature remained within the normal operating range",
                        "Similar deviations occurred on the previous three weekdays",
                    ],
                },
                "recommended_action": {
                    "title": "Reduce HVAC operation by 45 minutes during the evening window.",
                    "savings_kwh": 1420,
                    "value": 18460,
                    "cost": 0,
                    "payback": "Immediate",
                    "risk": "Low",
                    "confidence": 92,
                },
            },
            "weekend-baseload": {
                "what_happened": "Non-operating energy is recurring above the contextual baseline on recent weekends, drawing 18 kWh/hr above idle conditions.",
                "evidence": [
                    {"label": "Occupancy", "value": "↓ 0% (unoccupied)", "tone": "positive"},
                    {"label": "Weekend load", "value": "↑ 11.5%", "tone": "warning"},
                    {"label": "Temperature", "value": "→ normal", "tone": "neutral"},
                    {"label": "Residual energy", "value": "+18 kWh/hr", "tone": "warning"},
                ],
                "timeline": {"start": "09:00", "end": "16:00", "recurrence": "Recent weekends (Jul–Oct)"},
                "root_cause": {
                    "title": "Unshifted weekend non-critical loads",
                    "confidence": 86,
                    "evidence": [
                        "Zero occupancy recorded across 8 weekend intervals",
                        "Chilled water loop pressure remained at weekday operating setpoint",
                        "Non-critical loads were left scheduled during peak hours",
                        "Load profile consistent across recent weekend cycles",
                    ],
                },
                "recommended_action": {
                    "title": "Shift non-critical weekend load into the operating window.",
                    "savings_kwh": 780,
                    "value": 10140,
                    "cost": 0,
                    "payback": "Immediate",
                    "risk": "Low",
                    "confidence": 86,
                },
            },
            "lighting-schedule": {
                "what_happened": "Lighting load continues for two hours after the operating window on three weekdays without occupant trigger.",
                "evidence": [
                    {"label": "Occupancy", "value": "↓ 2% (after-hours)", "tone": "positive"},
                    {"label": "Lighting circuits", "value": "↑ 13.0%", "tone": "warning"},
                    {"label": "Schedule overrun", "value": "+2.0 hrs", "tone": "warning"},
                    {"label": "Residual energy", "value": "+12 kWh/hr", "tone": "warning"},
                ],
                "timeline": {"start": "19:00", "end": "21:00", "recurrence": "Mondays, Wednesdays & Fridays"},
                "root_cause": {
                    "title": "Lighting timer override lingering",
                    "confidence": 81,
                    "evidence": [
                        "Sweep timer set to 21:00 instead of 19:20",
                        "No occupancy sensor motion detected post-19:15",
                        "Circuit telemetry shows full floor illumination active",
                        "Corresponds to janitorial override not returning to auto-mode",
                    ],
                },
                "recommended_action": {
                    "title": "Stop lighting circuits 20 minutes after the operating window.",
                    "savings_kwh": 310,
                    "value": 4030,
                    "cost": 0,
                    "payback": "Immediate",
                    "risk": "Low",
                    "confidence": 81,
                },
            },
            "weather-spike": {
                "what_happened": "A short temperature excursion increased cooling demand beyond the learned range, revealing rooftop unit degradation.",
                "evidence": [
                    {"label": "Ambient temp", "value": "↑ 31.4°C (+4°C spike)", "tone": "warning"},
                    {"label": "RTU power draw", "value": "↑ 24.2%", "tone": "warning"},
                    {"label": "Indoor setpoint", "value": "→ 23.5°C", "tone": "neutral"},
                    {"label": "Residual energy", "value": "+26 kWh/hr", "tone": "warning"},
                ],
                "timeline": {"start": "13:00", "end": "16:00", "recurrence": "May 19, 2026 (weather excursion)"},
                "root_cause": {
                    "title": "Legacy rooftop unit compressor degradation",
                    "confidence": 74,
                    "evidence": [
                        "Excursion pushed unit into maximum compressor staging",
                        "COP degraded by 28% under high ambient conditions",
                        "Refrigerant pressure logs suggest coil fouling",
                        "Thermal comfort maintained but at disproportionate kWh cost",
                    ],
                },
                "recommended_action": {
                    "title": "Replace legacy rooftop unit with high-efficiency unit.",
                    "savings_kwh": 3100,
                    "value": 40300,
                    "cost": 84000,
                    "payback": "11 months",
                    "risk": "Medium",
                    "confidence": 78,
                },
            },
            "monday-inefficiency": {
                "what_happened": "A repeatable Monday evening pattern suggests setback schedules are not being reset consistently after weekend shutdowns.",
                "evidence": [
                    {"label": "Monday occupancy", "value": "↓ 12% (evening)", "tone": "positive"},
                    {"label": "HVAC rampdown", "value": "→ delayed 1.5 hrs", "tone": "warning"},
                    {"label": "Setpoint status", "value": "Manual hold", "tone": "warning"},
                    {"label": "Residual energy", "value": "+14 kWh/hr", "tone": "warning"},
                ],
                "timeline": {"start": "18:00", "end": "20:00", "recurrence": "Every Monday evening"},
                "root_cause": {
                    "title": "Manual setpoint override retention",
                    "confidence": 79,
                    "evidence": [
                        "Morning pre-cool override flag remains set into evening",
                        "BMS schedule logic fails to clear manual override automatically",
                        "Identical deviation observed across 4 consecutive Mondays",
                        "Simple BMS schedule reset logic prevents recurrence entirely",
                    ],
                },
                "recommended_action": {
                    "title": "Automate Monday BMS override clearing at 18:00.",
                    "savings_kwh": 240,
                    "value": 3120,
                    "cost": 0,
                    "payback": "Immediate",
                    "risk": "Low",
                    "confidence": 79,
                },
            },
        }
        detail_data = details_map.get(opportunity["id"], details_map["after-hours-hvac"])
        return {**opportunity, **detail_data}

    def simulate(self, params: dict[str, Any]) -> dict[str, Any]:
        hvac_minutes = float(params.get("hvac_minutes", 45))
        lighting_minutes = float(params.get("lighting_minutes", 20))
        load_shift_hours = float(params.get("load_shift_hours", 2))
        occupancy_delta = float(params.get("occupancy_delta", -10))
        saved = hvac_minutes * 40 + lighting_minutes * 8 + load_shift_hours * 75 + abs(occupancy_delta) * 22
        saved = max(0, round(saved))
        baseline = 48240
        scenario = max(0, baseline - saved)
        tariff = 13
        emission_factor = 0.71
        impact = "Low" if saved < 1800 else "Moderate"
        return {"parameters": params, "baseline_kwh": baseline, "scenario_kwh": scenario, "energy_saved_kwh": saved, "cost_saved": saved * tariff, "co2e_avoided": round(saved * emission_factor / 1000, 2), "operational_impact": impact, "assumptions": ["Tariff ₹13/kWh", "Grid factor 0.71 kgCO₂e/kWh", "Scenario is isolated from source readings"]}

    def impact(self) -> dict[str, Any]:
        return {"total_energy_saved": 12480, "cost_saved": 184200, "co2e_avoided": 9.7, "interventions": 14, "successful_interventions": 11, "baseline_kwh": 48200, "current_kwh": 43900, "improvement_percent": 8.9, "projected": {"energy_kwh": 12480, "cost": 184200, "co2e": 9.7, "interventions": 14}, "confirmed": {"energy_kwh": 9380, "cost": 121940, "co2e": 6.7, "interventions": 11}, "timeline": [{"label": "Jul", "projected": 2400, "confirmed": 1800}, {"label": "Aug", "projected": 3100, "confirmed": 2400}, {"label": "Sep", "projected": 3300, "confirmed": 2800}, {"label": "Oct", "projected": 3680, "confirmed": 2380}]}

    def data_health(self) -> dict[str, Any]:
        return {"building": "Orion Business Center", "dataset": "Orion Business Center Energy 2026", "rows": 8760, "time_range": "Jan 1 → Dec 31, 2026", "completeness": 99.6, "missing_values": {"timestamp": 0, "energy_kwh": 0, "occupancy": 17, "temperature": 8, "humidity": 10}, "last_analysis": "Oct 03, 2026 at 09:42", "model": {"version": self.model_version, "mae": 4.8, "rmse": 7.2, "trained_at": "Oct 03, 2026"}, "uploads": self.upload_history}

    def validate_csv(self, content: str, filename: str) -> dict[str, Any]:
        reader = csv.DictReader(io.StringIO(content))
        columns = set(reader.fieldnames or [])
        missing = sorted(REQUIRED_COLUMNS - columns)
        rows = list(reader)
        invalid_timestamps = 0
        if "timestamp" in columns:
            for row in rows:
                try:
                    datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    invalid_timestamps += 1
        valid = not missing and invalid_timestamps == 0 and bool(rows)
        result = {"filename": filename, "valid": valid, "columns": sorted(columns), "missing_columns": missing, "invalid_timestamps": invalid_timestamps, "rows": len(rows), "preview": rows[:3], "message": "Dataset is ready for analysis" if valid else "CSV needs attention before analysis"}
        if valid:
            self.upload_history.insert(0, {"dataset": filename, "rows": len(rows), "time_range": "Uploaded dataset", "completeness": 100 if not rows else 99.8, "status": "Ready for analysis", "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M")})
        return result


engine = ResourceOpsEngine()
