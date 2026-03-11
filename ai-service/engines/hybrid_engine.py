from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class HybridEngine:
    """Hybrid engine: Uses local ML for simple cases, OpenAI for complex ones"""
    
    def __init__(self, openai_engine, local_engine):
        self.openai_engine = openai_engine
        self.local_engine = local_engine
    
    async def analyze(
        self,
        text: str,
        include_psychological: bool = True,
        include_action_plan: bool = True
    ) -> Dict[str, Any]:
        """
        Smart routing:
        - Use local ML for simple/common cases (fast, free)
        - Use OpenAI for complex cases (accurate, expensive)
        """
        
        # First, get quick local analysis
        local_result = await self.local_engine.analyze(text)
        
        # Decision: Use OpenAI for complex cases
        should_use_openai = self._should_escalate_to_openai(text, local_result)
        
        if should_use_openai and self.openai_engine.is_available():
            logger.info("Escalating to OpenAI for complex analysis")
            openai_result = await self.openai_engine.analyze(
                text,
                include_psychological=include_psychological,
                include_action_plan=include_action_plan
            )
            # Combine insights from both
            return self._merge_results(local_result, openai_result, primary="openai")
        else:
            logger.info("Using local ML analysis")
            # Enhance local result with additional processing
            return self._enhance_local_result(local_result, text)
    
    def _should_escalate_to_openai(self, text: str, local_result: Dict) -> bool:
        """Decide if case is complex enough to warrant OpenAI"""
        
        # Escalate if:
        # 1. Critical urgency
        if local_result["urgency"] == "critical":
            return True
        
        # 2. Low confidence from local model
        if local_result.get("confidence_score", 0) < 0.7:
            return True
        
        # 3. Complex language (long text, multiple incidents)
        if len(text.split()) > 200:
            return True
        
        # 4. Mentions multiple perpetrators or locations
        if text.lower().count("and") > 5:
            return True
        
        # Otherwise, local ML is sufficient
        return False
    
    def _merge_results(self, local: Dict, openai: Dict, primary: str = "openai") -> Dict[str, Any]:
        """Merge results from both engines"""
        
        if primary == "openai":
            result = openai.copy()
            # Add local confidence as secondary metric
            result["local_confidence"] = local.get("confidence_score")
            result["consensus"] = local["urgency"] == openai["urgency"]
        else:
            result = local.copy()
            result["openai_confidence"] = openai.get("confidence_score")
        
        return result
    
    def _enhance_local_result(self, local_result: Dict, text: str) -> Dict[str, Any]:
        """Enhance local result with additional processing"""
        
        # Add psychological assessment (rule-based)
        psychological_state = self._simple_psychological_assessment(text, local_result)
        
        # Add action plan (template-based)
        action_plan = self._generate_template_action_plan(local_result)
        
        return {
            **local_result,
            "psychological_state": psychological_state,
            "action_plan": action_plan
        }
    
    def _simple_psychological_assessment(self, text: str, analysis: Dict) -> str:
        """Simple rule-based psychological assessment"""
        
        t = text.lower()
        
        if analysis["urgency"] == "critical":
            if any(kw in t for kw in ["scared", "afraid", "fear", "terrified"]):
                return "Victim shows signs of severe trauma and acute fear. Immediate psychological support critical."
            else:
                return "Critical situation requiring immediate trauma-informed intervention."
        
        elif analysis["urgency"] == "high":
            return "Victim likely experiencing significant distress. Counseling and support services recommended."
        
        elif analysis["urgency"] == "medium":
            return "Moderate psychological impact. Ongoing counseling support would be beneficial."
        
        else:
            return "Supportive counseling recommended to process experience."
    
    def _generate_template_action_plan(self, analysis: Dict) -> list:
        """Generate action plan based on analysis"""
        
        plan = []
        
        if analysis["immediate_danger"]:
            plan.append("Ensure victim safety - relocate to secure location immediately")
        
        if analysis["medical_attention_needed"]:
            plan.append("Arrange medical examination and treatment")
        
        if analysis["police_involvement_recommended"]:
            plan.append("File police report and preserve evidence")
        
        plan.append("Assign case to appropriate NGO based on specialization")
        plan.append("Provide trauma-informed counseling")
        plan.append("Develop long-term support plan")
        
        return plan
