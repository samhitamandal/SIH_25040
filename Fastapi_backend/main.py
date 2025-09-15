# In file: main.py

from fastapi import FastAPI
from app.api import routes as api_routes
from fastapi.middleware.cors import CORSMiddleware # 1. Add this import
origins = [
    "http://localhost:3000", 
]

# Create the FastAPI app instance
app = FastAPI(
    title="Argo Floatchat API",
    description="An API for querying Argo float data using a multi-agent RAG pipeline.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# Include the API router
app.include_router(api_routes.router, prefix="/api")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Argo Floatchat API!"}