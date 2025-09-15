import math
from datetime import date
from fastapi import HTTPException
from typing import List, Dict, Any
from . import postgres_service
from app.schemas.models import TimeSeriesResponse

def get_timeseries_at_depth_data(
    lat: float, 
    lng: float, 
    start_date: date, 
    end_date: date, 
    depth: int
) -> TimeSeriesResponse:
    """
    Calculates the grid_id and fetches the time-series data for a single,
    specified depth from the 'Argo_Depth_Ocean_Profiles' table.
    """
    # Calculate the target grid_id directly
    grid_lat_size, grid_lon_size = 2.0, 2.0
    grid_lat_center = math.floor(lat / grid_lat_size) * grid_lat_size + (grid_lat_size / 2)
    grid_lon_center = math.floor(lng / grid_lon_size) * grid_lon_size + (grid_lon_size / 2)
    target_grid_id = f"{grid_lat_center}_{grid_lon_center}"

    # This query gets the time-series for ONLY the specified depth
    sql_query = """
        SELECT
            grid_id,
            latitude,
            longitude,
            time_period as time,
            avg_temperature,
            avg_salinity
        FROM
            "argo_depth_ocean_profiles"
        WHERE
            grid_id = %(grid_id)s
            AND depth = %(depth)s
            AND time_period BETWEEN %(start_date)s AND %(end_date)s
        ORDER BY
            time_period ASC;
    """
    params = {
        'grid_id': target_grid_id,
        'depth': depth,
        'start_date': start_date,
        'end_date': end_date
    }

    try:
        results = postgres_service.execute_secure_query(sql_query, params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

    if not results:
        raise HTTPException(
            status_code=404, 
            detail=f"No data found for grid '{target_grid_id}' at depth {depth}m in the specified date range."
        )

    first_row = results[0]
    response_data = {
        "grid_id": first_row['grid_id'],
        "latitude": first_row['latitude'],
        "longitude": first_row['longitude'],
        "profiles": results
    }
    return TimeSeriesResponse(**response_data)


def get_depth_time_contour_data(
    lat: float,
    lng: float,
    start_date: date,
    end_date: date,
    variable: str = "temperature",
) -> Dict[str, Any]:
    """
    Build a depth-time temperature contour dataset for a given grid cell
    between start_date and end_date.

    Returns dict with keys:
      - times: List[date string]
      - depths: List[int]
      - temperature_matrix: List[List[float | None]] with shape [len(depths)][len(times)]
    """
    # Calculate the target grid_id
    grid_lat_size, grid_lon_size = 2.0, 2.0
    grid_lat_center = math.floor(lat / grid_lat_size) * grid_lat_size + (grid_lat_size / 2)
    grid_lon_center = math.floor(lng / grid_lon_size) * grid_lon_size + (grid_lon_size / 2)
    target_grid_id = f"{grid_lat_center}_{grid_lon_center}"

    # Validate variable
    variable = variable.lower()
    if variable not in ("temperature", "salinity"):
        raise HTTPException(status_code=400, detail="variable must be 'temperature' or 'salinity'")

    column = "avg_temperature" if variable == "temperature" else "avg_salinity"

    # Pull variable across depths and time for this grid
    sql_query = """
        SELECT
            time_period AS time,
            depth,
            {column}
        FROM
            "argo_depth_ocean_profiles"
        WHERE
            grid_id = %(grid_id)s
            AND time_period BETWEEN %(start_date)s AND %(end_date)s
        ORDER BY
            time_period ASC,
            depth ASC;
    """
    params = {
        'grid_id': target_grid_id,
        'start_date': start_date,
        'end_date': end_date,
    }

    try:
        rows = postgres_service.execute_secure_query(sql_query.format(column=column), params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No data found for grid '{target_grid_id}' between {start_date} and {end_date}."
            ),
        )

    # Collect unique sorted times and depths
    unique_times: List[date] = []
    unique_depths_set = set()
    for r in rows:
        t = r['time']
        if t not in unique_times:
            unique_times.append(t)
        unique_depths_set.add(r['depth'])
    unique_depths: List[int] = sorted(unique_depths_set)

    # Create map (depth -> index) and (time -> index)
    time_to_idx: Dict[date, int] = {t: i for i, t in enumerate(unique_times)}
    depth_to_idx: Dict[int, int] = {d: i for i, d in enumerate(unique_depths)}

    # Initialize matrix with None
    matrix: List[List[Any]] = [
        [None for _ in range(len(unique_times))] for _ in range(len(unique_depths))
    ]

    # Fill matrix
    for r in rows:
        ti = time_to_idx[r['time']]
        di = depth_to_idx[r['depth']]
        matrix[di][ti] = r[column]

    # Convert dates to ISO strings for JSON
    times_str: List[str] = [t.isoformat() for t in unique_times]

    return {
        'grid_id': target_grid_id,
        'times': times_str,
        'depths': unique_depths,
        'variable': variable,
        'matrix': matrix,
    }