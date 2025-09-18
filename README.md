# FloatChat 🌊



> **AI-Powered Conversational Interface for ARGO Ocean Data Discovery and Visualization**

FloatChat is a revolutionary platform that democratizes access to complex oceanographic data through natural language querying and interactive visualizations. Built for Smart India Hackathon 2025 (Problem Statement ID: SIH25040).

---

## 🎯 Problem Statement

**Background**: Oceanographic data from sources like ARGO floats is vast, complex, and heterogeneous. Accessing, querying, and visualizing this data requires domain knowledge, technical skills, and familiarity with complex NetCDF formats and command-line tools.

**Challenge**: Bridge the gap between domain experts, decision-makers, and raw ocean data by enabling non-technical users to extract meaningful insights effortlessly through natural language interactions.

---

## ✨ Key Features

### 🗣️ **Chat-Based Exploration**
- Query historical and real-time ARGO data using natural language
- RAG pipeline powered by multimodal LLMs for accurate responses
- Data-validated responses tied to actual ARGO database records

### 📊 **Interactive Geospatial Dashboards**
- Visualize float trajectories with interactive maps
- Generate depth-time plots for temperature and salinity
- Historical ocean conditions through intuitive heat maps
- Real-time data exploration capabilities

### 📁 **On-Demand Data Export**
- Direct download of dashboard-queried subsets
- Multiple formats: ASCII, NetCDF, CSV
- Bypass complex global ARGO NetCDF archives

### 🗄️ **Compact Data Modeling**
- Transform massive NetCDF datasets into compact, query-ready PostgreSQL format
- Real-time data processing and aggregation
- Grid-based organization (2° × 2°) for efficient storage

### 🔒 **Advanced Access Control**
- Role-based access management via Supabase
- Separate portal for researchers to directly query databases
- Data integrity and security measures

---

## 🏗️ System Architecture

### Data Processing Pipeline
```
ARGO NetCDF Data → Data Cleaning → Grid Organization (2°×2°) → PostgreSQL Storage
                                                              ↓
Vector Embeddings ← ChromaDB ← Metadata Processing ← Summarizing Agent
```

### Query Processing Flow
```
User Query → Query Embedding → Semantic Search → LLM SQL Generation → Database Query → Response
```

---

## 🛠️ Technology Stack

### **Frontend**
- **ReactJS** - User interface
- **Plotly** - Interactive visualizations
- **Leaflet** - Geospatial mapping

### **Backend**
- **FastAPI** - Python web framework
- **PostgreSQL** - Primary database
- **ChromaDB** - Vector database
- **Gemini API / LLaMA** - Large Language Models

### **Deployment & Infrastructure**
- **Supabase** - Backend-as-a-Service
- **Docker** - Containerization
- **AWS EC2** - Cloud hosting

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker & Docker Compose
- PostgreSQL
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/sih_25040.git
cd sih_25040
```

2. **Backend Setup**
```bash
# Navigate to backend directory
cd Fastapi_backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Configure your database URL, API keys, etc.

# Run database migrations
python manage.py migrate

# Start the FastAPI server
uvicorn main:app --reload
```

3. **Frontend Setup**
```bash
# Navigate to frontend directory
cd argo_frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

4. **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/floatchat
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CHROMA_PERSIST_DIRECTORY=./chroma_db
```

---

## 💡 Usage Examples

### Natural Language Queries
```
🌊 "Show me salinity profiles near the equator in March 2023"
🌊 "Compare BGC parameters in the Arabian Sea for the last 6 months"
🌊 "What are the nearest ARGO floats to latitude 15°N, longitude 68°E?"
🌊 "Display temperature trends in the Indian Ocean over the past year"
```

### Dashboard Features
- **Float Trajectories**: Interactive map showing ARGO float paths
- **Depth-Time Plots**: Temperature and salinity profiles over time
- **Heat Maps**: Spatial distribution of ocean parameters
- **Data Export**: Download filtered datasets in various formats

---

## 🔧 API Endpoints

### Data Query Endpoints
```
GET  /api/floats              # Get all ARGO floats
GET  /api/floats/{float_id}   # Get specific float data
POST /api/query               # Natural language query
GET  /api/profiles            # Get temperature/salinity profiles
POST /api/export              # Export filtered data
```

### Dashboard Endpoints
```
GET  /api/dashboard/trajectories    # Float trajectory data
GET  /api/dashboard/heatmap        # Heat map data
GET  /api/dashboard/timeseries     # Time series data
```

---

## 🎯 Key Innovations

### 🧠 **Multi-Agentic Framework**
- LLM forms SQL queries using semantic context + user query
- Follows Model Context Protocol (MCP) for structured communication
- Summarizing agent forms detailed responses

### 🔍 **Semantic Search with Metadata Filtering**
- Vector embeddings stored in ChromaDB
- Top-k relevant document retrieval
- LLM-guided metadata filtering for precision

### 📊 **Efficient Data Storage**
- Ocean divided into 2° × 2° grids
- Aggregated data in optimized PostgreSQL tables
- Compact representation of massive NetCDF datasets

---

## 🌟 Impact & Benefits

### **Democratized Data Access**
- Removes need for NetCDF expertise
- Natural language querying for all users
- Intuitive visual dashboards

### **Research Acceleration**
- Fast data discovery and analysis
- Automated query generation
- Direct database access for advanced users

### **Policy Support**
- Evidence-based insights for decision-makers
- Real-time ocean condition monitoring
- Climate policy and marine planning support

### **Educational Tool**
- Engaging platform for students
- Real-world dataset exploration
- Interactive learning experience

---

## 🔮 Future Enhancements

### **Extended Data Sources**
- BGC floats integration
- Buoy and glider data
- Satellite dataset incorporation
- INCOIS observation integration

### **Advanced Features**
- Anomaly detection capabilities
- Tsunami alert systems
- Cyclone tracking integration
- Coastal hazard warnings

### **Scalability Improvements**
- Open-source LLM integration (LLaMA, Mistral)
- Advanced caching mechanisms
- Multi-region deployment

---

## 🧪 Technical Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Massive NetCDF Data Volume** | Grid-based aggregation and preprocessing to compress TBs to GBs |
| **LLM Query Ambiguity** | Vector database with semantic search and metadata filtering |
| **API Rate Limits & Costs** | Query caching + open-source LLM integration |
| **Data Integrity** | All responses tied to actual database records, eliminating hallucinations |

---

## 👥 Team Neural Ninjas

**Smart India Hackathon 2025**
- Team ID: SIH-011
- Problem Statement: SIH25040
- Theme: Miscellaneous
- Category: Software

---

## 📚 References

1. [Indian Argo Project](https://incois.gov.in/OON/index.jsp)
2. [Global Argo Data Repository](https://www.ncei.noaa.gov/products/global-argo-data-repository)
3. [Argopy Python Library](https://argopy.readthedocs.io/en/v1.3.0/)
4. [Supabase PostgreSQL Database](https://supabase.com/docs/guides/database/overview)
5. [ChromaDB Documentation](https://docs.trychroma.com/docs/querying-collections/query-and-get)

---

<div align="center">

**🌊 Making Ocean Data Accessible to Everyone 🌊**

</div>`
