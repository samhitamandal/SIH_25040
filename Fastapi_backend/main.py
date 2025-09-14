# In file: main.py

from fastapi import FastAPI
from app.api import routes as api_routes

# Create the FastAPI app instance
app = FastAPI(
    title="Argo Floatchat API",
    description="An API for querying Argo float data using a multi-agent RAG pipeline.",
    version="1.0.0"
)

# Include the API router
app.include_router(api_routes.router, prefix="/api")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Argo Floatchat API!"}