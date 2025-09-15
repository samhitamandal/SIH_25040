import math
from datetime import date
from fastapi import HTTPException
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