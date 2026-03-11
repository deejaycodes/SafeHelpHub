# SafeHelpHub AI Service (Python)

Advanced AI analysis microservice with ML capabilities.

## Features

- **3 Analysis Engines:**
  - `openai`: OpenAI GPT-4 (same as TypeScript)
  - `local`: Local ML models (learns from your data)
  - `hybrid`: Smart routing (local for simple, OpenAI for complex)

- **Capabilities:**
  - Structured data extraction
  - Psychological assessment
  - Action plan generation
  - Pattern detection
  - Model training on your data

## Quick Start

### 1. Install Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Run Service

```bash
python main.py
```

Service runs on `http://localhost:8000`

## API Endpoints

### Analyze Incident

```bash
POST /analyze
{
  "text": "incident description",
  "engine": "hybrid",  # or "openai" or "local"
  "include_psychological": true,
  "include_action_plan": true
}
```

### Health Check

```bash
GET /health
```

### Train Model

```bash
POST /train
[
  {
    "description": "incident text",
    "urgency": "critical",
    "classification": "FGM"
  }
]
```

## Using with TypeScript Backend

### Enable Hybrid Service

Add to `.env`:

```
USE_HYBRID_AI_SERVICE=true
PYTHON_AI_SERVICE_URL=http://localhost:8000
AI_ENGINE=hybrid  # or "openai" or "local"
```

### Disable (Use TypeScript Only)

```
USE_HYBRID_AI_SERVICE=false
```

## Docker Deployment

```bash
docker build -t safehelpub-ai .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key safehelpub-ai
```

## Training Your Own Model

Once you have 50+ reports:

```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d @training_data.json
```

Models are saved to `models/` directory.

## Engine Comparison

| Feature | OpenAI | Local | Hybrid |
|---------|--------|-------|--------|
| Cost | $0.03/req | Free | $0.01/req |
| Speed | 2-5s | <100ms | 100ms-3s |
| Accuracy | 95% | 75-90% | 90-95% |
| Learns | No | Yes | Yes |
| Offline | No | Yes | Partial |

## Architecture

```
TypeScript Backend
       ↓
  Feature Flag
       ↓
   ┌────┴────┐
   ↓         ↓
TypeScript  Python
Analysis    Service
            ↓
      ┌─────┴─────┐
      ↓           ↓
   OpenAI      Local ML
   Engine      Engine
```
