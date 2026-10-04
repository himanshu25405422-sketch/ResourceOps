"""Materialize the deterministic demo dataset for upload demos and inspection."""

import csv
from pathlib import Path

from app.engine import generate_readings


if __name__ == "__main__":
    output = Path(__file__).parent / "data" / "orion_energy_2026.csv"
    output.parent.mkdir(exist_ok=True)
    rows = generate_readings()
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {output}")

