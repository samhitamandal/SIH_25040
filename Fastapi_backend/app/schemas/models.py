from pydantic import BaseModel
from typing import List, Dict, Any

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