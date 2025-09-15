import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
import time

# --- Load Configuration and Initialize LLM ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Error: GEMINI_API_KEY not found in .env file.")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


# --- Database Schema for the LLM's Context ---
POSTGRES_SCHEMA = """
You have access to a PostgreSQL database with two tables:

1. `"Average_Ocean_Profiles"`: This table has historical data of the Indian Ocean, Bay of Bengal, and Arabian Sea. It contains surface-level depth data.
   Columns:
   - `"TIME"` (date): The date of the measurement.
   - `grid_id` (text): A unique identifier for the geographical grid cell.
   - `latitude` (float): The center latitude of the grid cell.
   - `longitude` (float): The center longitude of the grid cell.
   - `avg_temperature` (float): The average temperature for the grid cell on that day.
   - `avg_salinity` (float): The average salinity for the grid cell on that day.
   - `argo_float_ids` (text): IDs of the argo floats that contributed to the average.

2. `Argo_Depth_Ocean_Profiles`: This table has historical data for the same regions but contains depth-wise profiles.
   Columns:
   - `time_period` (date): The date of the measurement.
   - `grid_id` (text): A unique identifier for the geographical grid cell.
   - `depth` (integer): The depth in meters, with possible values of 10, 100, 200, 500, or 1000.
   - `latitude` (float): The center latitude of the grid cell.
   - `longitude` (float): The center longitude of the grid cell.
   - `avg_temperature` (float): The average temperature at that depth.
   - `avg_salinity` (float): The average salinity at that depth.
"""

def generate_sql_query(user_query: str, retrieved_docs: list) -> str:
    """
    Uses an LLM to generate a PostgreSQL query based on user input and retrieved context.

    Args:
        user_query (str): The original natural language query from the user.
        retrieved_docs (list): A list of relevant documents from the retrieval agent.

    Returns:
        str: A single, executable PostgreSQL query string.
    """
    
    context_str = json.dumps(retrieved_docs, indent=2)

    prompt = f"""
    You are an expert PostgreSQL query writer. Your task is to generate a precise SQL query to retrieve data from a database based on a user's question and some relevant context.

    **Database Schema:**
    {POSTGRES_SCHEMA}

    **User Query:**
    "{user_query}"

    **Relevant Context from a vector search (use this for location and time clues):**
    {context_str}

    **Instructions:**
    1. **Table Selection:**
       - If the user's query mentions "depth," "profiles," or specific depth levels (e.g., "at 100m"), you MUST query the `Argo_Ocean_Depth_Profiles` table.
       - Otherwise, for general or surface-level queries, you MUST query the `Average_Ocean_Profiles` table.

    2. **Filtering:**
       - Use the date and location from the User Query as the primary source for WHERE clause filters. Use the 'Relevant Context' as supplementary information, for example, to identify specific grid_ids or to understand the general area of interest.
       - For the `Average_Ocean_Profiles` table, filter on the `TIME` column. For the `Argo_Ocean_Depth_Profiles` table, filter on the `time_period` column.

    3. **Column Selection:**
       - Select only the columns that are most relevant to answering the user's query.

    4. **Output:**
       - Generate a single, complete, and syntactically correct PostgreSQL query.
       - Do NOT include any explanations, markdown formatting, or anything other than the SQL query itself.

    **Generated SQL Query:**
    """

    print("> Generating SQL query from context...")
    retries = 3
    wait_time = 5  # seconds

    # 2. Start a loop for the retries.
    for i in range(retries):
        try:
            # 3. The API call is inside the try block as before.
            response = model.models.generate_content(
                model="gemini-1.5-flash", # Using a more recent model name
                contents=prompt
            )
            sql_query = response.text
            cleaned_sql = sql_query.strip().replace("```sql", "").replace("```", "").strip()
            
            print(f"> Successfully generated SQL: {cleaned_sql}")
            # If the call succeeds, return the result and exit the loop.
            return cleaned_sql

        except Exception as e:
            # 4. Check if the error is a temporary, retryable one.
            if "503" in str(e) or "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"Model is overloaded (error: {e}). Retrying in {wait_time}s... ({i+1}/{retries})")
                # Wait for the specified time.
                time.sleep(wait_time)
                # Increase the wait time for the next potential retry.
                wait_time *= 2
                # The 'continue' statement moves to the next iteration of the loop.
                continue
            else:
                # 5. If it's a different error, don't retry.
                print(f"An unexpected, non-retryable error occurred: {e}")
                return "SELECT 'An error occurred during SQL generation';"

    # 6. If the loop finishes after all retries have failed.
    print("> Failed to generate SQL after multiple retries.")
    return "SELECT 'Failed to generate SQL after multiple retries';"

    # # --- END: EXPONENTIAL BACKOFF LOGIC ---
    # try:
    #     response = model.models.generate_content(
    #         model="gemini-2.5-flash",
    #         contents=prompt
    #     )
    #     sql_query = response.text
    #     # Clean up the response to ensure it's just a raw SQL string
    #     cleaned_sql = sql_query.strip().replace("```sql", "").replace("```", "").strip()
    # except Exception as e:
    #     print(f"An error occurred during SQL generation: {e}")
    #     cleaned_sql = "SELECT 'An error occurred during SQL generation';"

    # print(f"> Successfully generated SQL: {cleaned_sql}")
    # return cleaned_sql  