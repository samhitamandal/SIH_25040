# In file: app/api/routes.py

from fastapi import APIRouter, HTTPException, Query
from ..schemas.models import QueryRequest, QueryResponse
from ..agents.retrieval_agent import retrieve_vector_docs
from ..agents.sql_agent import generate_sql_query
from ..agents.summarization_agent import summarize_and_respond
from ..services.postgres_service import execute_sql_query
from ..schemas.models import TimeSeriesResponse
from datetime import date
from ..services import argo_service
from typing import List, Optional

# Create a new router
router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Receives a user query and orchestrates the full RAG pipeline.
    """
    try:
        # --- Step 1: Retrieval Agent ---
        # Get the most relevant documents from ChromaDB.
        print("--- Running Retrieval Agent ---")
        retrieved_docs = retrieve_vector_docs(request.query, request.k)
        
        if not retrieved_docs:
            # Handle case where no documents are found
            raise HTTPException(status_code=404, detail="No relevant documents found in the vector database.")

        # --- Step 2: SQL Generation Agent ---
        # Use the retrieved context to generate a SQL query.
        print("\n--- Running SQL Generation Agent ---")
        sql_query = generate_sql_query(request.query, retrieved_docs)

        # --- Step 3: Execute the SQL Query ---
        # Run the generated query against the PostgreSQL database.
        print("\n--- Executing SQL Query ---")
        sql_results = execute_sql_query(sql_query)

        # --- Step 4: Summarization Agent ---
        # Synthesize a final answer from all gathered context.
        print("\n--- Running Summarization Agent ---")
        final_answer = summarize_and_respond(request.query, sql_results)
        
        # --- Step 5: Return the final, structured response ---
        return QueryResponse(
            user_query=request.query,
            final_answer=final_answer,
            retrieved_docs=retrieved_docs,
            generated_sql=sql_query,
            sql_results=sql_results
        )

    except Exception as e:
        # A general error handler for any unexpected issues in the pipeline
        print(f"An unexpected error occurred in the pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# --- NEW ENDPOINT FOR TIME-SERIES AT A SPECIFIC DEPTH ---
@router.get(
    "/timeseries_at_depth/",
    response_model=TimeSeriesResponse,
    summary="Get time-series data for a specific depth"
)
def get_timeseries_at_depth_endpoint(
    lat: float, 
    lng: float, 
    start_date: date, 
    end_date: date, 
    depth: int  # The new required parameter
):
    """
    Calculates the grid_id and returns the time-series of avg_temperature
    and avg_salinity for a SINGLE specified depth.
    """
    return argo_service.get_timeseries_at_depth_data(
        lat=lat, 
        lng=lng, 
        start_date=start_date, 
        end_date=end_date,
        depth=depth
    )

# --- NEW: Trajectory endpoint ---
@router.get("/trajectories")
def get_trajectories(
    argo_ids: List[str] = Query(..., description="One or more Argo IDs; repeat param or comma-separated"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    # Normalize: support comma-separated values in addition to repeated params
    normalized_ids: List[str] = []
    for raw in argo_ids:
        parts = [p.strip() for p in raw.split(',') if p.strip()]
        normalized_ids.extend(parts)
    return argo_service.get_trajectories_by_argo_ids(argo_ids=normalized_ids, start_date=start_date, end_date=end_date)

@router.get("/debug/argo_ids")
def debug_argo_ids():
    """Debug endpoint to see what argo_float_ids look like in the database"""
    from ..services.postgres_service import execute_secure_query
    sql = """
    SELECT argo_float_ids, COUNT(*) as count
    FROM "average_ocean_profiles" 
    WHERE argo_float_ids IS NOT NULL 
    GROUP BY argo_float_ids 
    ORDER BY count DESC 
    LIMIT 10
    """
    try:
        results = execute_secure_query(sql, {})
        return {"sample_argo_float_ids": results}
    except Exception as e:
        return {"error": str(e)}