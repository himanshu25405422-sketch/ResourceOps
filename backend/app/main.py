from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .engine import engine


class SimulationRequest(BaseModel):
    hvac_minutes: float = Field(default=45, ge=0, le=180)
    lighting_minutes: float = Field(default=20, ge=0, le=120)
    load_shift_hours: float = Field(default=2, ge=0, le=12)
    occupancy_delta: float = Field(default=-10, ge=-50, le=50)


app = FastAPI(title="ResourceOps API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "resourceops-api", "model_version": engine.model_version}


@app.get("/api/buildings")
def buildings() -> list[dict[str, Any]]:
    return [engine.dashboard()["building"]]


@app.get("/api/dashboard")
def dashboard() -> dict[str, Any]:
    return engine.dashboard()


@app.get("/api/energy/overview")
def energy_overview(period: str = "7D") -> dict[str, Any]:
    return engine.energy_series(period)


@app.get("/api/energy/series")
def energy_series(period: str = "7D") -> dict[str, Any]:
    return engine.energy_series(period)


@app.get("/api/opportunities")
def opportunities() -> list[dict[str, Any]]:
    return engine.opportunities


@app.get("/api/opportunities/{opportunity_id}")
def opportunity_detail(opportunity_id: str) -> dict[str, Any]:
    return engine.opportunity_detail(opportunity_id)


@app.get("/api/recommendations")
def recommendations() -> list[dict[str, Any]]:
    return engine.recommendations


@app.post("/api/simulations")
def simulations(request: SimulationRequest) -> dict[str, Any]:
    return engine.simulate(request.model_dump())


@app.get("/api/impact")
def impact() -> dict[str, Any]:
    return engine.impact()


@app.get("/api/data/health")
def data_health() -> dict[str, Any]:
    return engine.data_health()


@app.post("/api/data/upload")
async def upload(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file.")
    content = (await file.read()).decode("utf-8-sig")
    return engine.validate_csv(content, file.filename)

