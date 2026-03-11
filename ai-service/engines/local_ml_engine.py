from typing import Dict, Any, List
import re
import logging
from datetime import datetime
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

logger = logging.getLogger(__name__)


class LocalMLEngine:
    """Local ML-based analysis (no API calls, learns from your data)"""
    
    def __init__(self):
        self.urgency_model = None
        self.classification_model = None
        self.vectorizer = TfidfVectorizer(max_features=500)
        self.is_trained = False
        self._load_models()
        
    def is_loaded(self) -> bool:
        return self.is_trained
    
    def _load_models(self):
        """Load pre-trained models if they exist"""
        try:
            if os.path.exists("models/urgency_model.pkl"):
                with open("models/urgency_model.pkl", "rb") as f:
                    self.urgency_model = pickle.load(f)
                with open("models/classification_model.pkl", "rb") as f:
                    self.classification_model = pickle.load(f)
                with open("models/vectorizer.pkl", "rb") as f:
                    self.vectorizer = pickle.load(f)
                self.is_trained = True
                logger.info("Loaded pre-trained models")
        except Exception as e:
            logger.warning(f"No pre-trained models found: {e}")
    
    async def analyze(self, text: str) -> Dict[str, Any]:
        """Analyze using local ML models + rule-based system"""
        
        # If models are trained, use ML predictions
        if self.is_trained:
            return await self._ml_analysis(text)
        else:
            # Fallback to advanced rule-based system
            return await self._rule_based_analysis(text)
    
    async def _ml_analysis(self, text: str) -> Dict[str, Any]:
        """ML-based analysis using trained models"""
        
        # Vectorize text
        features = self.vectorizer.transform([text])
        
        # Predict urgency
        urgency_pred = self.urgency_model.predict(features)[0]
        urgency_proba = self.urgency_model.predict_proba(features)[0]
        confidence = float(max(urgency_proba))
        
        # Predict classification
        classification = self.classification_model.predict(features)[0]
        
        # Extract entities using NLP
        entities = self._extract_entities(text)
        
        # Generate recommendations based on predictions
        recommendations = self._generate_recommendations(urgency_pred, classification, entities)
        
        return {
            "urgency": urgency_pred,
            "classification": classification,
            "extracted_entities": entities,
            "recommended_actions": recommendations["actions"],
            "immediate_danger": recommendations["immediate_danger"],
            "medical_attention_needed": recommendations["medical_needed"],
            "police_involvement_recommended": recommendations["police_needed"],
            "recommended_ngo_types": recommendations["ngo_types"],
            "confidence_score": confidence
        }
    
    async def _rule_based_analysis(self, text: str) -> Dict[str, Any]:
        """Advanced rule-based analysis (fallback when no training data)"""
        
        t = text.lower()
        
        # Urgency scoring system
        urgency_score = 0
        urgency_indicators = {
            "critical": ["kill", "weapon", "gun", "knife", "blood", "dying", "death", "murder"],
            "high": ["fgm", "mutilation", "cutting", "rape", "severe", "beating", "torture"],
            "medium": ["hit", "slap", "abuse", "violence", "threat", "force"],
            "low": ["harass", "verbal", "insult", "argument"]
        }
        
        for level, keywords in urgency_indicators.items():
            if any(kw in t for kw in keywords):
                if level == "critical":
                    urgency_score = 4
                    break
                elif level == "high" and urgency_score < 3:
                    urgency_score = 3
                elif level == "medium" and urgency_score < 2:
                    urgency_score = 2
                elif level == "low" and urgency_score < 1:
                    urgency_score = 1
        
        urgency_map = {4: "critical", 3: "high", 2: "medium", 1: "low", 0: "low"}
        urgency = urgency_map[urgency_score]
        
        # Classification
        classification = "General Incident"
        if any(kw in t for kw in ["fgm", "mutilation", "cutting", "circumcision"]):
            classification = "Female Genital Mutilation"
        elif any(kw in t for kw in ["rape", "sexual assault", "molest"]):
            classification = "Sexual Violence"
        elif any(kw in t for kw in ["domestic", "husband", "wife", "partner", "spouse"]):
            classification = "Domestic Violence"
        elif any(kw in t for kw in ["child", "minor", "young", "girl"]):
            classification = "Child Abuse"
        elif any(kw in t for kw in ["harass", "stalk", "follow"]):
            classification = "Harassment"
        
        # Extract entities
        entities = self._extract_entities(text)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(urgency, classification, entities)
        
        return {
            "urgency": urgency,
            "classification": classification,
            "extracted_entities": entities,
            "recommended_actions": recommendations["actions"],
            "immediate_danger": recommendations["immediate_danger"],
            "medical_attention_needed": recommendations["medical_needed"],
            "police_involvement_recommended": recommendations["police_needed"],
            "recommended_ngo_types": recommendations["ngo_types"],
            "confidence_score": 0.75  # Rule-based confidence
        }
    
    def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract entities using regex and NLP"""
        
        entities = {}
        
        # Extract age
        age_match = re.search(r'(\d+)\s*(year|yr|yo|years old)', text, re.IGNORECASE)
        if age_match:
            entities["victimAge"] = int(age_match.group(1))
        
        # Extract location (Nigerian states)
        nigerian_states = ["Lagos", "Kano", "Abuja", "Rivers", "Kaduna", "Oyo", "Enugu", "Delta", "Edo"]
        for state in nigerian_states:
            if state.lower() in text.lower():
                entities["location"] = state
                break
        
        # Extract perpetrator relationship
        t = text.lower()
        if any(kw in t for kw in ["husband", "wife", "spouse"]):
            entities["perpetratorRelationship"] = "spouse"
        elif any(kw in t for kw in ["father", "mother", "parent"]):
            entities["perpetratorRelationship"] = "parent"
        elif any(kw in t for kw in ["family", "relative", "uncle", "aunt"]):
            entities["perpetratorRelationship"] = "family member"
        elif "stranger" in t:
            entities["perpetratorRelationship"] = "stranger"
        elif any(kw in t for kw in ["boyfriend", "girlfriend", "partner"]):
            entities["perpetratorRelationship"] = "intimate partner"
        
        # Extract timeframe
        if any(kw in t for kw in ["today", "now", "currently", "right now"]):
            entities["timeframe"] = "ongoing"
        elif any(kw in t for kw in ["yesterday", "last night"]):
            entities["timeframe"] = "recent (24h)"
        elif any(kw in t for kw in ["last week", "few days"]):
            entities["timeframe"] = "recent (week)"
        
        entities["incidentType"] = self._classify_incident_type(text)
        
        return entities
    
    def _classify_incident_type(self, text: str) -> str:
        """Classify incident type"""
        t = text.lower()
        if "fgm" in t or "mutilation" in t:
            return "Female Genital Mutilation"
        elif "rape" in t or "sexual" in t:
            return "Sexual Violence"
        elif "domestic" in t:
            return "Domestic Violence"
        return "General Violence"
    
    def _generate_recommendations(self, urgency: str, classification: str, entities: Dict) -> Dict[str, Any]:
        """Generate recommendations based on analysis"""
        
        actions = []
        ngo_types = []
        immediate_danger = False
        medical_needed = False
        police_needed = False
        
        if urgency == "critical":
            immediate_danger = True
            medical_needed = True
            police_needed = True
            actions.extend([
                "Contact emergency services immediately (199/112)",
                "Ensure victim is in safe location",
                "Arrange immediate medical attention"
            ])
            ngo_types.extend(["emergency", "medical", "legal"])
        
        elif urgency == "high":
            medical_needed = True
            police_needed = True
            actions.extend([
                "Provide safe shelter",
                "Medical assessment required",
                "Document all evidence"
            ])
            ngo_types.extend(["shelter", "medical", "legal"])
        
        elif urgency == "medium":
            police_needed = True
            actions.extend([
                "Document all incidents",
                "Consider legal protection order",
                "Provide counseling support"
            ])
            ngo_types.extend(["legal", "counseling"])
        
        else:  # low
            actions.append("Provide counseling and support services")
            ngo_types.append("counseling")
        
        # Add classification-specific recommendations
        if classification == "Female Genital Mutilation":
            actions.append("Contact WARIF: +234-809-210-0009")
            medical_needed = True
            ngo_types.append("fgm-specialist")
        
        if entities.get("victimAge") and entities["victimAge"] < 18:
            actions.append("Contact child protection services")
            ngo_types.append("child-protection")
        
        return {
            "actions": actions,
            "ngo_types": list(set(ngo_types)),
            "immediate_danger": immediate_danger,
            "medical_needed": medical_needed,
            "police_needed": police_needed
        }
    
    async def train(self, reports: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train models on historical reports"""
        
        if len(reports) < 10:
            raise Exception("Need at least 10 reports to train")
        
        # Prepare training data
        texts = [r["description"] for r in reports]
        urgencies = [r["urgency"] for r in reports]
        classifications = [r["classification"] for r in reports]
        
        # Vectorize texts
        X = self.vectorizer.fit_transform(texts)
        
        # Train urgency model
        self.urgency_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.urgency_model.fit(X, urgencies)
        
        # Train classification model
        self.classification_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.classification_model.fit(X, classifications)
        
        # Save models
        os.makedirs("models", exist_ok=True)
        with open("models/urgency_model.pkl", "wb") as f:
            pickle.dump(self.urgency_model, f)
        with open("models/classification_model.pkl", "wb") as f:
            pickle.dump(self.classification_model, f)
        with open("models/vectorizer.pkl", "wb") as f:
            pickle.dump(self.vectorizer, f)
        
        self.is_trained = True
        
        # Calculate accuracy
        urgency_score = self.urgency_model.score(X, urgencies)
        classification_score = self.classification_model.score(X, classifications)
        
        logger.info(f"Models trained on {len(reports)} reports")
        
        return {
            "urgency_accuracy": float(urgency_score),
            "classification_accuracy": float(classification_score),
            "training_samples": len(reports)
        }
