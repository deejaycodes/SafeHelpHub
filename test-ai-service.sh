#!/bin/bash

echo "=== Testing Python AI Service ==="
echo ""

# Test 1: Health Check
echo "1. Health Check"
curl -s http://localhost:8000/health | jq '.'
echo ""

# Test 2: Simple Analysis
echo "2. Simple Incident Analysis"
curl -s -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Woman being beaten by husband in Lagos",
    "engine": "openai"
  }' | jq '.urgency, .classification, .recommended_actions'
echo ""

# Test 3: Critical Incident
echo "3. Critical FGM Incident"
curl -s -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "12-year-old girl subjected to FGM, bleeding heavily, needs immediate medical attention",
    "engine": "openai",
    "include_psychological": true,
    "include_action_plan": true
  }' | jq '{
    urgency,
    classification,
    immediate_danger,
    medical_attention_needed,
    psychological_state,
    action_plan,
    processing_time_ms
  }'
echo ""

# Test 4: Via Backend
echo "4. Test via NestJS Backend (creates actual report)"
curl -s -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "incident_type": "Physical Abuse",
    "description": "Domestic violence case in Lagos, victim needs shelter",
    "location": "Lagos"
  }' | jq '.ai_analysis'
echo ""

echo "=== Tests Complete ==="
