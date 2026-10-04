# ResourceOps

ResourceOps is a software-only energy operations intelligence prototype for
commercial buildings. It turns contextual operational data into ranked
opportunities, recommendations, reproducible what-if scenarios, and measured
impact.

The golden demo is wired end to end:

`Orion Business Center → contextual baseline → after-hours HVAC → evidence → recommendation → simulation → impact`

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend has deterministic fallback data, so
all pages remain navigable without the API during UI development.

## Run the API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

The FastAPI service runs at `http://localhost:8000` and exposes the routes in
the build brief, including CSV upload validation and isolated simulations.

## Scope

This prototype intentionally excludes IoT hardware, physical controls,
authentication, billing, mobile apps, messaging integrations, and other
resource domains. Numerical intelligence is deterministic and separate from
language/UI concerns; projected and confirmed impact are kept distinct.

