
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict, Any

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


def execute_secure_query(sql_query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Executes a SQL query with parameters in a secure way.
    This is intended for new, dashboard-related features.
    """
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            print(f"> Executing SECURE SQL.")
            # Pass the query and params separately for safe execution
            cursor.execute(sql_query, params)
            results = cursor.fetchall()
            print(f"> Found {len(results)} records from PostgreSQL.")
            return results
            
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        raise e
        
    finally:
        if conn is not None:
            conn.close()
            print("> Database connection closed.")