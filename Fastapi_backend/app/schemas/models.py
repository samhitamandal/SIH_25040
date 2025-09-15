from pydantic import BaseModel
from typing import List, Dict, Any,Optional
from datetime import date

# Pydantic model for the incoming request
class QueryRequest(BaseModel):
    query: str
    k: int = 10 # Number of documents to retrieve, with a default value

# Pydantic model for the final, structured response
class QueryResponse(BaseModel):
    user_query: str
    final_answer: str
    retrieved_docs: List[Dict[str, Any]]
    generated_sql: str
    sql_results: List[Dict[str, Any]]


# Represents a single data point in time
class TimeSeriesPoint(BaseModel):
    time: date
    avg_temperature: Optional[float]
    avg_salinity: Optional[float]

# Represents the entire API response for a time-series request
class TimeSeriesResponse(BaseModel):
    grid_id: str
    latitude: float
    longitude: float
    profiles: List[TimeSeriesPoint]

# --- Trajectories ---
class TrajectoryPoint(BaseModel):
    time: date
    latitude: float
    longitude: float
    grid_id: str

class TrajectorySeries(BaseModel):
    argo_id: str
    points: List[TrajectoryPoint]

class TrajectoriesResponse(BaseModel):
    trajectories: List[TrajectorySeries]