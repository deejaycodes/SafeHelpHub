from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import logging

# Import AI engines
from engines.openai_engine import OpenAIEngine
from engines.local_ml_engine import LocalMLEngine
from engines.hybrid_engine import HybridEngine

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SafeHelpHub AI Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
openai_engine = OpenAIEngine(api_key=os.getenv("OPENAI_API_KEY"))
local_engine = LocalMLEngine()
hybrid_engine = HybridEngine(openai_engine, local_engine)


class AnalysisRequest(BaseModel):
    text: str
    engine: str = "hybrid"  # "openai", "local", or "hybrid"
    include_psychological: bool = True
    include_action_plan: bool = True


class AnalysisResponse(BaseModel):
    urgency: str
    classification: str
    extracted_entities: Dict[str, Any]
    recommended_actions: List[str]
    immediate_danger: bool
    medical_attention_needed: bool
    police_involvement_recommended: bool
    recommended_ngo_types: List[str]
    psychological_state: Optional[str] = None
    action_plan: Optional[List[str]] = None
    confidence_score: float
    processing_time_ms: float
    engine_used: str


@app.get("/")
async def root():
    return {
        "service": "SafeHelpHub AI Analysis Service",
        "version": "1.0.0",
        "status": "operational",
        "engines": ["openai", "local", "hybrid"]
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "openai_available": openai_engine.is_available(),
        "local_model_loaded": local_engine.is_loaded()
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_incident(request: AnalysisRequest):
    """
    Analyze incident report using specified engine
    """
    import time
    start_time = time.time()
    
    try:
        if request.engine == "openai":
            result = await openai_engine.analyze(
                request.text,
                include_psychological=request.include_psychological,
                include_action_plan=request.include_action_plan
            )
        elif request.engine == "local":
            result = await local_engine.analyze(request.text)
        elif request.engine == "hybrid":
            result = await hybrid_engine.analyze(
                request.text,
                include_psychological=request.include_psychological,
                include_action_plan=request.include_action_plan
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid engine. Use 'openai', 'local', or 'hybrid'")
        
        processing_time = (time.time() - start_time) * 1000
        result["processing_time_ms"] = processing_time
        result["engine_used"] = request.engine
        
        logger.info(f"Analysis completed in {processing_time:.2f}ms using {request.engine} engine")
        return result
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/batch-analyze")
async def batch_analyze(texts: List[str], engine: str = "hybrid"):
    """
    Analyze multiple incidents in batch
    """
    results = []
    for text in texts:
        request = AnalysisRequest(text=text, engine=engine)
        result = await analyze_incident(request)
        results.append(result)
    return results


@app.post("/train")
async def train_model(reports: List[Dict[str, Any]]):
    """
    Train/update local model with new data
    """
    try:
        result = await local_engine.train(reports)
        return {"status": "success", "message": f"Model trained on {len(reports)} reports", "metrics": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
