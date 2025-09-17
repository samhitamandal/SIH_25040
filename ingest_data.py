import os
import glob
import re
import numpy as np
import pandas as pd
import chromadb
from datetime import datetime

# --- Configuration ---
ARGO_DATA_DIR = './argo_data'
CHROMA_HOST = 'localhost'
CHROMA_PORT = 8000
COLLECTION_NAME = 'argo_profiles'
BATCH_SIZE = 5000 

# --- ChromaDB Client Setup ---
try:
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    client.heartbeat()
    print("Successfully connected to ChromaDB server.")
except Exception as e:
    print(f"Error connecting to ChromaDB: {e}")
    print("Please ensure your ChromaDB Docker container is running.")
    exit()

def extract_float_ids(ids_string):
    """
    Parses a string like '[np.int64(12345)]' into a list of integers.
    """
    matches = re.findall(r'np\.int64\((\d+)\)', ids_string)
    return ', '.join(matches)

def process_and_ingest_data(data_directory, collection):
    """
    Reads CSV files, generates a descriptive string for each row, 
    and ingests the data into ChromaDB, handling both 2D and 3D formats.
    """
    documents = []
    metadatas = []
    ids = []
    
    file_paths = glob.glob(os.path.join(data_directory, '*.csv'))
    if not file_paths:
        print(f"No CSV files found in '{data_directory}'. Please check the path.")
        return

    print(f"Found {len(file_paths)} data files. Starting data ingestion...")
    
    for file_path in file_paths:
        print(f"Processing file: {file_path}")
        try:
            df = pd.read_csv(file_path)

            is_3d_data = 'depth' in df.columns
            
            required_cols = ['TIME', 'latitude', 'longitude', 'avg_temperature', 'avg_salinity']
            if is_3d_data:
                required_cols.append('depth')

            df.dropna(subset=required_cols, inplace=True)
            
            if df.empty:
                print(f"Warning: No valid data found in {file_path}. Skipping.")
                continue
            # print("\n--- DEBUGGING DATE PARSING ---")
            # print(f"File: {os.path.basename(file_path)}")
            # print("Original 'TIME' column sample:")
            # print(df['TIME'].head())
            # print("\nParsed 'parsed_time' column sample (NaT means 'Not a Time'):")
            # print(df['parsed_time'].head())
            # print(f"\nTotal rows with valid dates: {df['parsed_time'].notna().sum()} / {len(df)}")
            # print("--------------------------------\n")
            for index, row in df.iterrows():
                float_ids_raw = row.get('argo_float_ids', '[np.int64(0)]')
                float_ids_clean = extract_float_ids(str(float_ids_raw))
                
                temp_val = row.get('avg_temperature', np.nan)
                sal_val = row.get('avg_salinity', np.nan)
                latitude = row.get('latitude', np.nan)
                longitude = row.get('longitude', np.nan)
                
                year, month, day = None, None, None
                descriptive_string = ""
                
                time_str = str(row.get('TIME', ''))
                try:
                    time_obj = datetime.strptime(time_str, '%Y-%m-%d')
                    year = time_obj.year
                    month = time_obj.month
                    day = time_obj.day
                    time_formatted = time_obj.strftime('%Y-%m-%d')
                except ValueError:
                    time_formatted = time_str
                
                if is_3d_data:
                    depth = str(row.get('depth', 'unknown'))
                    descriptive_string = (
                        f"An Argo float measured an average temperature of {temp_val:.2f}°C "
                        f"and an average salinity of {sal_val:.2f} PSU "
                        f"at a depth of {depth} meters "
                        f"at a location of {latitude:.2f}N, {longitude:.2f}E on {time_formatted}."
                    )
                    doc_id = f"{float_ids_clean}-{time_formatted}-{depth}-{index}"
                else:
                    descriptive_string = (
                        f"Some Argo floats measured an average temperature of {temp_val:.2f}°C "
                        f"and an average salinity of {sal_val:.2f} PSU "
                        f"at a location of {latitude:.2f}N, {longitude:.2f}E "
                        f"on {time_formatted}."
                    )
                    doc_id = f"{float_ids_clean}-{time_formatted}-{index}"
                
                documents.append(descriptive_string)
                
                metadata_dict = {
                    'source_file': os.path.basename(file_path),
                    'float_ids': float_ids_clean,
                    'latitude': float(latitude),
                    'longitude': float(longitude),
                    'temperature': float(temp_val),
                    'salinity': float(sal_val),
                }

                if year is not None:
                    metadata_dict['year'] = year
                if month is not None:
                    metadata_dict['month'] = month
                if day is not None:
                    metadata_dict['day'] = day
                if is_3d_data and 'depth' in row:
                    metadata_dict['depth'] = int(depth)
                
                metadatas.append(metadata_dict)
                ids.append(doc_id)

        except Exception as e:
            print(f"Error processing file {file_path}: {e}. Skipping.")
            continue
            
    if documents:
        print(f"Adding {len(documents)} documents to ChromaDB in batches...")
        for i in range(0, len(documents), BATCH_SIZE):
            batch_docs = documents[i:i + BATCH_SIZE]
            batch_metadatas = metadatas[i:i + BATCH_SIZE]
            batch_ids = ids[i:i + BATCH_SIZE]
            collection.add(
                documents=batch_docs,
                metadatas=batch_metadatas,
                ids=batch_ids
            )
        print("Data ingestion complete.")
    else:
        print("No valid data to ingest.")

if __name__ == "__main__":
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    client.delete_collection(name=COLLECTION_NAME)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    process_and_ingest_data(ARGO_DATA_DIR, collection)
