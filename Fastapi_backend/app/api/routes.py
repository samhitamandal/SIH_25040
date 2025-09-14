# In file: app/api/routes.py

from fastapi import APIRouter, HTTPException
from ..schemas.models import QueryRequest, QueryResponse
from ..agents.retrieval_agent import retrieve_vector_docs
from ..agents.sql_agent import generate_sql_query
from ..agents.summarization_agent import summarize_and_respond
from ..services.postgres_service import execute_sql_query

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