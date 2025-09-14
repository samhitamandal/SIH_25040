
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

def execute_sql_query(sql_query: str) -> list:
    conn = None
    try:
        # Connect using the single connection string
        conn = psycopg2.connect(DATABASE_URL)
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # ... rest of the function is exactly the same
            print(f"> Executing SQL: {sql_query}")
            cursor.execute(sql_query)
            results = [dict(row) for row in cursor.fetchall()]
            print(f"> Found {len(results)} records from PostgreSQL.")
            return results
            
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return []
        
    finally:
        if conn is not None:
            conn.close()
            print("> Database connection closed.")