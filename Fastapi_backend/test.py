# In file: diagnose_chroma.py

import chromadb
import os
import json
from dotenv import load_dotenv

load_dotenv()

CHROMA_HOST = os.getenv("CHROMA_HOST", 'localhost')
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8000))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", 'argo_profiles')

try:
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    collection = client.get_collection(name=COLLECTION_NAME)
    print(f"✅ Connected to collection '{COLLECTION_NAME}'.")

    # Get the first 5 items from the collection to inspect their metadata
    results = collection.get(
        limit=5,
        include=["metadatas"]
    )

    print("\n--- Inspecting Metadata of 5 Documents ---")
    print(json.dumps(results['metadatas'], indent=2))
    print("------------------------------------------")

except Exception as e:
    print(f"❌ An error occurred: {e}")