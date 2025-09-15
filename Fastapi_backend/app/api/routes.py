from fastapi import APIRouter, HTTPException
from ..schemas.models import QueryRequest, QueryResponse, TimeSeriesResponse
from ..agents.retrieval_agent import retrieve_vector_docs
from ..agents.sql_agent import generate_sql_query
from ..agents.summarization_agent import summarize_and_respond
from ..services.postgres_service import execute_sql_query
from datetime import date
from ..services import argo_service

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Receives a user query and orchestrates the full RAG pipeline.
    """
    try:
        # --- Step 1: Retrieval Agent ---
        print("--- Running Retrieval Agent ---")
        retrieved_docs = retrieve_vector_docs(request.query, request.k)
        
        if not retrieved_docs:
            raise HTTPException(status_code=404, detail="No relevant documents found in the vector database.")

        # --- Step 2: SQL Generation Agent ---
        print("\n--- Running SQL Generation Agent ---")
        sql_query = generate_sql_query(request.query, retrieved_docs)

        # --- Step 3: Execute the SQL Query ---
        print("\n--- Executing SQL Query ---")
        sql_results = execute_sql_query(sql_query)

        # --- Step 4: Summarization Agent ---
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
        print(f"An unexpected error occurred in the pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    depth: int
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