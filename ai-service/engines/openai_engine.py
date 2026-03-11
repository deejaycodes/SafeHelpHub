from typing import Dict, Any, List, Optional
import openai
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)


class OpenAIEngine:
    """OpenAI-based analysis engine (same as current TypeScript implementation)"""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key) if api_key else None
        
    def is_available(self) -> bool:
        return self.client is not None
    
    async def analyze(
        self,
        text: str,
        include_psychological: bool = True,
        include_action_plan: bool = True
    ) -> Dict[str, Any]:
        """Multi-agent analysis using OpenAI"""
        
        if not self.client:
            raise Exception("OpenAI API key not configured")
        
        # Agent 1: Structured data extraction
        structured_data = await self._extract_structured_data(text)
        
        # Agent 2: Psychological assessment (optional)
        psychological_state = None
        if include_psychological:
            psychological_state = await self._assess_psychological_state(text)
        
        # Agent 3: Action plan (optional)
        action_plan = None
        if include_action_plan:
            action_plan = await self._generate_action_plan(text, structured_data)
        
        return {
            **structured_data,
            "psychological_state": psychological_state,
            "action_plan": action_plan,
            "confidence_score": 0.85  # OpenAI baseline confidence
        }
    
    async def _extract_structured_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data using function calling"""
        
        completion = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are an expert analyst for FGM and violence cases in Nigeria."
            }, {
                "role": "user",
                "content": text
            }],
            tools=[{
                "type": "function",
                "function": {
                    "name": "analyze_incident",
                    "description": "Extract structured data from incident report",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "urgency": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                            "classification": {"type": "string"},
                            "victimAge": {"type": "number"},
                            "perpetratorRelationship": {"type": "string"},
                            "location": {"type": "string"},
                            "timeframe": {"type": "string"},
                            "immediateDanger": {"type": "boolean"},
                            "medicalAttentionNeeded": {"type": "boolean"},
                            "policeInvolvementRecommended": {"type": "boolean"},
                            "recommendedNgoTypes": {"type": "array", "items": {"type": "string"}},
                            "recommendedActions": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["urgency", "classification", "immediateDanger", "medicalAttentionNeeded", 
                                   "policeInvolvementRecommended", "recommendedNgoTypes", "recommendedActions"]
                    }
                }
            }],
            tool_choice={"type": "function", "function": {"name": "analyze_incident"}}
        )
        
        function_call = completion.choices[0].message.tool_calls[0].function
        data = eval(function_call.arguments)  # Parse JSON
        
        return {
            "urgency": data["urgency"],
            "classification": data["classification"],
            "extracted_entities": {
                "location": data.get("location"),
                "incidentType": data["classification"],
                "timeframe": data.get("timeframe"),
                "victimAge": data.get("victimAge"),
                "perpetratorRelationship": data.get("perpetratorRelationship")
            },
            "recommended_actions": data["recommendedActions"],
            "immediate_danger": data["immediateDanger"],
            "medical_attention_needed": data["medicalAttentionNeeded"],
            "police_involvement_recommended": data["policeInvolvementRecommended"],
            "recommended_ngo_types": data["recommendedNgoTypes"]
        }
    
    async def _assess_psychological_state(self, text: str) -> str:
        """Assess psychological state"""
        
        completion = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "You are a trauma-informed psychologist. Assess emotional state in 2-3 sentences."
            }, {
                "role": "user",
                "content": f"Assess psychological state:\n\n{text}"
            }],
            temperature=0.5,
            max_tokens=150
        )
        
        return completion.choices[0].message.content.strip()
    
    async def _generate_action_plan(self, text: str, structured_data: Dict) -> List[str]:
        """Generate action plan"""
        
        completion = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": "Create a 4-6 step action plan for NGOs. Return JSON array."
            }, {
                "role": "user",
                "content": f"Urgency: {structured_data['urgency']}\nIncident: {text}\n\nCreate action plan as JSON: {{\"steps\": [\"step1\", \"step2\"]}}"
            }],
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        
        result = eval(completion.choices[0].message.content)
        return result.get("steps", result.get("actionPlan", []))
