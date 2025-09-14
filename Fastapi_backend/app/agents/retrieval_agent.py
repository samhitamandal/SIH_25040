import chromadb
import os
import json
from dotenv import load_dotenv
from google import genai
import time

load_dotenv()
CHROMA_HOST = os.getenv("CHROMA_HOST", 'localhost')
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8000))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", 'argo_profiles')
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Initialize Clients ---
# LLM Client
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file.")
    exit()
model = genai.Client(api_key=GEMINI_API_KEY)

# ChromaDB Client
try:
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    collection = client.get_collection(name=COLLECTION_NAME)
    print("Successfully connected to ChromaDB and collection.")
except Exception as e:
    print(f"Error connecting to ChromaDB: {e}")
    exit()

# --- Context for the LLM ---
# This schema helps the LLM understand what metadata fields are available for filtering.
DATABASE_SCHEMA_FOR_FILTERING = """
Metadata fields available for filtering in the vector database:
- `latitude` (float): Center latitude of the grid cell.
- `longitude` (float): Center longitude of the grid cell.
- `argo_float_ids` (text): Comma-separated list of Argo float IDs.
"""

def _generate_chroma_filter(user_query: str) -> dict:
    """
    (Internal Helper) Uses an LLM to generate a ChromaDB 'where' filter.
    """
    # This prompt has been updated with a critical rule for handling ranges.
    prompt = f"""
    You are an expert at creating database filters for ChromaDB. Your task is to analyze the user's query and generate a valid ChromaDB 'where' filter as a JSON object.

    **Metadata Schema:**
    - `latitude` (float): Center latitude of the grid cell.
    - `longitude` (float): Center longitude of the grid cell.
    - `year` (int): The year of the measurement.
    - `month` (int): The month of the measurement (1-12).
    - `day` (int): The day of the measurement (1-31).
    - `temperature` (float): The average temperature in degrees Celsius.
    - `salinity` (float): The average salinity in PSU.
    - `depth` (int): The measurement depth in meters (only for 3D data).
    - `float_ids` (str): Comma-separated string of contributing float IDs.

    **User Query:**
    "{user_query}"
    **Geographical Knowledge Base:**
    Use these latitude and longitude boundaries when a user mentions a specific named location:
    - "equator": A latitude range from -10 to 10.
    - "Arabian Sea": A latitude range from 8 to 25 AND a longitude range from 50 to 75.
    - "Bay of Bengal": A latitude range from 5 to 22 AND a longitude range from 80 to 95.
    - "Indian Ocean": A general latitude range from -20 to 30 AND a longitude range from 30 to 120.

    **CRITICAL RULE FOR RANGES:**
    When filtering a single field on a range (e.g., "temperature between 10 and 20"), you MUST create two separate dictionary entries inside an `$and` list.
    - **CORRECT:** `{{"$and": [{{"temperature": {{"$gte": 10}}}}, {{"temperature": {{"$lte": 20}}}}]}}`
    - **INCORRECT:** `{{"$and": [{{"temperature": {{"$gte": 10, "$lte": 20}}}}]}}`

    **OTHER RULES:**
    1. For a location box (e.g., "in the North Atlantic"), combine all latitude and longitude conditions into a single `$and` list. Example: `{{"$and": [{{"latitude": {{"$gte": 30}}}}, {{"latitude": {{"$lte": 60}}}}, {{"longitude": {{"$gte": -75}}}}, {{"longitude": {{"$lte": -15}}}}]}}`.
    2. For a time filter (e.g., "in March 2023"), use `$and` with `year` and `month`. Example: `{{"$and": [{{"year": {{"$eq": 2023}}}}, {{"month": {{"$eq": 3}}}}]}}`.
    3. For a single value filter (e.g., "temperature above 20 degrees"), use operators like `$gte` or `$lt`. Example: `{{"temperature": {{"$gte": 20.0}}}}.`
    4. If no specific filters can be extracted, return an empty JSON object: {{}}.

    Based on the query and all the rules, what is the appropriate ChromaDB 'where' filter?
    Return ONLY the JSON object, with no other text or explanations.
    """
    print("\n> Generating filter from query...")
    retries = 3
    wait_time = 5  # Start with a 5-second wait

    for i in range(retries):
        try:
            generation_config = {
                "temperature": 0.1,
                "top_p": 1.0,
            }
            # The API call is now inside the loop
            response = model.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            filter_text = response.text.strip().replace("```json", "").replace("```", "").strip()
            filter_dict = json.loads(filter_text)
            
            print(f"> Successfully generated filter: {filter_dict}")
            # If successful, return the result and exit the function
            return filter_dict

        except Exception as e:
            # Check if the error is a temporary, retryable one
            if "503" in str(e) or "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"Model is overloaded. Retrying in {wait_time}s... ({i+1}/{retries})")
                time.sleep(wait_time)
                wait_time *= 2  # Double the wait time for the next attempt
                continue # Go to the next iteration of the loop
            else:
                # If it's a different, non-retryable error, fail immediately
                print(f"An unexpected, non-retryable error occurred: {e}")
                return {} # Fallback to an empty filter

    # This part is reached only if all retries have failed
    print("> Failed to generate filter after multiple retries.")
    return {}
    # --- END: EXPONENTIAL BACKOFF LOGIC ---

def retrieve_vector_docs(user_query: str, k: int = 10) -> list:
    """
    The main retrieval agent. It generates a filter and queries ChromaDB.
    
    Args:
        user_query (str): The user's natural language query.
        k (int): The number of documents to retrieve.

    Returns:
        list: A formatted list of retrieved documents.
    """
    # Step 1: Use the LLM to intelligently generate the metadata filter.
    where_filter = _generate_chroma_filter(user_query)
    
    # Step 2: Query ChromaDB using both semantic search and the generated filter.
    print(f"\n> Querying ChromaDB with semantic text and filter...")
    results = collection.query(
        query_texts=[user_query],
        n_results=k,
        where=where_filter,
        include=['documents', 'metadatas', 'distances']
    )
    
    # Step 3: Format the results for the next agent.
    formatted_results = []
    if results and results['documents'] and results['documents'][0]:
        for doc, meta, dist in zip(results['documents'][0], results['metadatas'][0], results['distances'][0]):
            formatted_results.append({
                "document": doc,
                "metadata": meta,
                "distance": dist
            })
    
    print(f"> Retrieved {len(formatted_results)} documents.")
    return formatted_results
