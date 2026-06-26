"""
One-time extractor: turn a USGS ShakeMap `shake_result.hdf` into the compact
multi-layer `SeismicGrid` JSON that EvalúaYa stores in `seismic_events.grid`.

Why this exists
---------------
The live app only needs a fast point lookup of several ground-motion metrics at
a building's coordinate. The raw HDF is ~31 MB and stores full-resolution grids
(460 x 552 ≈ 1.8 km spacing) plus uncertainty, distances and station data we do
not need at runtime. This script keeps only the `mean` field of the metrics we
use, converts the natural-log IMTs to physical units, downsamples ~3x
(≈5 km spacing — plenty for a point lookup that is bilinearly interpolated),
rounds aggressively, and writes a ~1.2 MB JSON.

Layers kept (all bilinearly interpolated at lookup time):
  mmi   Modified Mercalli Intensity (linear)
  pga   peak ground acceleration, g      (exp of ln g)
  pgv   peak ground velocity, cm/s       (exp of ln cm/s)
  sa03  spectral acceleration @ 0.3 s, g (low-rise demand)
  sa06  spectral acceleration @ 0.6 s, g
  sa10  spectral acceleration @ 1.0 s, g (mid/high-rise demand)
  sa30  spectral acceleration @ 3.0 s, g (tall/long-period demand)
  vs30  site shear-wave velocity, m/s    (soil stiffness / amplification)

Usage:
  python scripts/extract-shakemap.py path/to/shake_result.hdf out.json
The resulting JSON is written into `seismic_events.grid` for the active event.
"""

import sys
import json
import numpy as np
import h5py

STEP = 3  # downsample factor (~5 km grid)

BASE = "arrays/imts/GREATER_OF_TWO_HORIZONTAL"
LAYERS = {
    # key: (hdf path, ln->physical?, decimals; 0 => integer)
    "mmi": (f"{BASE}/MMI/mean", False, 1),
    "pga": (f"{BASE}/PGA/mean", True, 3),
    "pgv": (f"{BASE}/PGV/mean", True, 1),
    "sa03": (f"{BASE}/SA(0.3)/mean", True, 3),
    "sa06": (f"{BASE}/SA(0.6)/mean", True, 3),
    "sa10": (f"{BASE}/SA(1.0)/mean", True, 3),
    "sa30": (f"{BASE}/SA(3.0)/mean", True, 3),
    "vs30": ("arrays/vs30", False, 0),
}


def main(src: str, dst: str) -> None:
    f = h5py.File(src, "r")
    info = json.loads(f["dictionaries/info.json"][()])
    mi = info["output"]["map_information"]
    x0 = float(mi["min"]["longitude"])
    x1 = float(mi["max"]["longitude"])
    y0 = float(mi["min"]["latitude"])
    y1 = float(mi["max"]["latitude"])
    nx = int(mi["grid_points"]["longitude"])
    ny = int(mi["grid_points"]["latitude"])

    ys = list(range(0, ny, STEP))
    xs = list(range(0, nx, STEP))
    if ys[-1] != ny - 1:
        ys.append(ny - 1)
    if xs[-1] != nx - 1:
        xs.append(nx - 1)

    out_layers = {}
    for key, (path, is_ln, decimals) in LAYERS.items():
        a = f[path][:].astype("float64")
        if is_ln:
            a = np.exp(a)
        vals = []
        for iy in ys:
            row = a[iy]
            for ix in xs:
                v = row[ix]
                if not np.isfinite(v):
                    vals.append(None)
                elif decimals > 0:
                    vals.append(round(float(v), decimals))
                else:
                    vals.append(int(round(float(v))))
        out_layers[key] = vals

    grid = {
        "x0": round(x0, 5),
        "x1": round(x1, 5),
        "nx": len(xs),
        "y0": round(y0, 5),
        "y1": round(y1, 5),
        "ny": len(ys),
        "layers": out_layers,
    }
    with open(dst, "w") as fh:
        json.dump(grid, fh, separators=(",", ":"))
    print(f"wrote {dst}: {grid['nx']}x{grid['ny']} layers={list(out_layers)}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: python scripts/extract-shakemap.py <shake_result.hdf> <out.json>")
        raise SystemExit(1)
    main(sys.argv[1], sys.argv[2])
