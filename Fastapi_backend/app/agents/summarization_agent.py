import json
from google import genai
import os
from dotenv import load_dotenv
import time
from datetime import datetime, date

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
model = genai.Client(api_key=GEMINI_API_KEY)

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def summarize_and_respond(user_query: str, sql_results: list) -> str:
    """
    Synthesizes information from ChromaDB and PostgreSQL to generate a final answer.
    The final answer is formatted using Markdown for improved readability.

    Args:
        user_query (str): The original user query.
        sql_results (list): Precise data from the PostgreSQL query.

    Returns:
        str: A final, cohesive natural language answer formatted in Markdown.
    """
    
    # Convert the list of dictionaries to a more readable string format
    sql_results_str = json.dumps(sql_results, indent=2, default=json_serial)

    prompt = f"""
    You are an expert oceanographer's assistant. Your task is to synthesize information from a database query to provide a comprehensive, natural language answer to the user's question.

    **User's Original Question:**
    "{user_query}"

    **Precise Data from PostgreSQL Database (specific values):**
    {sql_results_str}

    **Instructions:**
    1. Analyze all the provided information.
    2. Formulate a concise, easy-to-understand answer that directly addresses the user's question.
    3. Use **Markdown** formatting to improve readability. This includes:
       - Using **bolding** to highlight key terms, depths, or numerical values.
       - Using bullet points (`* ` or `- `) or numbered lists for key findings.
       - Using subheadings (`## `) to structure the response by depth or location.
    4. If the PostgreSQL data shows specific numbers, trends, or values (like average temperatures), mention them in your answer.
    5. If the data is empty or inconclusive, state that clearly.
    6. Do not just list the data; explain what it means in the context of the user's question.
    7. Ensure the response is well-structured and easy for a non-expert to read.
    8. Generate the final answer in **Markdown** format.    
    **Final Answer:**
    """

    print("> Synthesizing the final answer...")
    
    try:
        time.sleep(3)
        response = model.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        final_answer = response.text.strip().replace("```", "").strip()
        print(final_answer)
    except Exception as e:
        print(f"An error occurred during final answer generation: {e}")
        final_answer = "I'm sorry, but I encountered an error while trying to formulate a final response."

    print("> Final answer generated.")
    return final_answer