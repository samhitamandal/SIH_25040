import math
from datetime import date
from fastapi import HTTPException
from . import postgres_service
from app.schemas.models import TimeSeriesResponse, TrajectoriesResponse

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


def get_trajectories_by_argo_ids(argo_ids: list, start_date: date = None, end_date: date = None) -> TrajectoriesResponse:
    """
    Fetch trajectory points (time, lat, lon) for each provided Argo float ID
    from the surface-level table where `argo_float_ids` contains that ID.

    The `Average_Ocean_Profiles` schema provided has columns:
    TIME (date), grid_id (text), latitude (float8), longitude (float8),
    avg_temperature (float8), avg_salinity (float8), argo_float_ids (jsonb)

    We query rows where the jsonb array contains the given argo_id.
    """
    if not argo_ids:
        raise HTTPException(status_code=400, detail="No argo_ids provided")

    # Single query: expand comma-separated text into rows and filter via ANY(list)
    date_filter_clauses = []
    params: list = [argo_ids]  # psycopg2 adapts Python list to SQL array for ANY
    if start_date is not None:
        date_filter_clauses.append("\"TIME\" >= %s")
        params.append(start_date)
    if end_date is not None:
        date_filter_clauses.append("\"TIME\" <= %s")
        params.append(end_date)
    date_filter_sql = (" AND " + " AND ".join(date_filter_clauses)) if date_filter_clauses else ""

    sql_query = (
        """
        SELECT btrim(elem) AS argo_id,
               "TIME" as time,
               latitude,
               longitude,
               grid_id
        FROM "average_ocean_profiles"
        CROSS JOIN LATERAL unnest(
            string_to_array(
                translate(argo_float_ids::text, '[]"{} ', ''),
                ','
            )
        ) AS elem
        WHERE btrim(elem) = ANY(%s)
        """
        + date_filter_sql +
        """
        ORDER BY "TIME" ASC
        """
    )

    try:
        rows = postgres_service.execute_secure_query(sql_query, params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

    # Group by argo_id
    id_to_points = {}
    for row in rows:
        key = row["argo_id"]
        id_to_points.setdefault(key, []).append({
            "time": row["time"],
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            "grid_id": row["grid_id"],
        })

    trajectories = [{"argo_id": k, "points": v} for k, v in id_to_points.items()]
    return TrajectoriesResponse(trajectories=trajectories)