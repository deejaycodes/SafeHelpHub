# 🤖 AI SERVICE ARCHITECTURE - SafeVoice

## 📊 OVERVIEW

The AI service in SafeVoice uses **OpenAI GPT-4** to analyze GBV reports in two stages:
1. **Spam Validation** (blocks fake reports)
2. **Urgency Analysis** (prioritizes critical cases)

---

## 🔄 COMPLETE FLOW

```
USER SUBMITS REPORT
       ↓
┌──────────────────────────────────────────────────────┐
│ STAGE 1: SPAM VALIDATION (GPT-4o-mini)              │
│ Cost: ~$0.0004 per report                            │
│ Time: ~1-2 seconds                                   │
└──────────────────────────────────────────────────────┘
       ↓
   Is Valid?
       ↓
    ❌ NO → Reject (return error to user)
       ↓
    ✅ YES → Save to DB + Emit Event
       ↓
┌──────────────────────────────────────────────────────┐
│ USER GETS INSTANT RESPONSE (200ms)                   │
│ "Report received successfully"                       │
└──────────────────────────────────────────────────────┘
       ↓
═══════════════════════════════════════════════════════
BACKGROUND PROCESSING (User doesn't wait)
═══════════════════════════════════════════════════════
       ↓
┌──────────────────────────────────────────────────────┐
│ STAGE 2: URGENCY ANALYSIS (GPT-4)                   │
│ Cost: ~$0.03 per report                              │
│ Time: ~5-10 seconds                                  │
│                                                      │
│ Three Parallel AI Calls:                            │
│ 1. Extract Structured Data (urgency, classification)│
│ 2. Assess Psychological State                       │
│ 3. Generate Action Plan                             │
└──────────────────────────────────────────────────────┘
       ↓
   Update DB with AI Analysis
       ↓
   If Urgent (critical/high)
       ↓
   Emit Event → Notify NGOs
```

---

## 🎯 STAGE 1: SPAM VALIDATION

### **Purpose:** Block fake/spam reports before wasting resources

### **Model:** GPT-4o-mini (fast + cheap)

### **Input:**
```typescript
{
  description: "User's report text",
  incidentType: "sexual_abuse" | "child_abuse" | "fgm" | etc.
}
```

### **AI Prompt:**
```
You are a content validator for a GBV/FGM reporting platform in Nigeria.

Classify this report as:
- VALID: Real incident (FGM, abuse, assault, violence)
- SPAM: Gibberish, profanity, trolling, test messages
- UNCLEAR: Too vague but might be genuine (needs human review)

Consider:
- Language barriers (broken English is OK)
- Emotional language (fear, anger is valid)
- Cultural context (Nigerian English)

Report: "I need help my uncle has been touching me inappropriately"

Respond with JSON:
{
  "status": "VALID",
  "reason": "Describes sexual abuse by family member",
  "confidence": 95
}
```

### **Output:**
```typescript
{
  isValid: true,
  status: "VALID" | "SPAM" | "UNCLEAR",
  reason: "Brief explanation",
  confidence: 0-100
}
```

### **Decision Logic:**
- **VALID** → Continue to Stage 2
- **SPAM** → Reject immediately (return error to user)
- **UNCLEAR** → Save with status "PENDING_REVIEW" (human review)

### **Fallback:** If OpenAI fails, uses rule-based validation:
- Check word count (min 10 words)
- Detect spam phrases ("test test test", "asdf")
- Detect gibberish (repeated characters)

---

## 🚨 STAGE 2: URGENCY ANALYSIS

### **Purpose:** Determine how urgent the case is + what actions to take

### **Model:** GPT-4 (more accurate for complex analysis)

### **Three Parallel AI Calls:**

#### **1. Extract Structured Data** (Function Calling)
```typescript
// AI extracts:
{
  urgency: "critical" | "high" | "medium" | "low",
  classification: "Sexual Abuse" | "FGM" | "Domestic Violence" | etc.,
  extractedEntities: {
    location: "Lagos",
    victimAge: 14,
    perpetratorRelationship: "uncle",
    timeframe: "ongoing"
  },
  immediateDanger: true,
  medicalAttentionNeeded: true,
  policeInvolvementRecommended: true,
  recommendedNgoTypes: ["medical", "legal", "counseling"],
  recommendedActions: [
    "Ensure victim is in safe location",
    "Contact medical services immediately",
    "Document evidence if safe to do so"
  ]
}
```

**How It Works:**
- Uses OpenAI **Function Calling** (structured output)
- AI fills in a predefined schema
- Guarantees consistent data format

#### **2. Assess Psychological State**
```typescript
// AI analyzes emotional state:
{
  psychologicalState: "Victim shows signs of trauma and fear. 
                       Immediate counseling recommended."
}
```

#### **3. Generate Action Plan**
```typescript
// AI creates step-by-step plan:
{
  actionPlan: [
    "1. Ensure victim is in safe location away from perpetrator",
    "2. Contact medical services for examination and treatment",
    "3. Document incident details while memory is fresh",
    "4. Connect with legal aid for protection order",
    "5. Arrange trauma counseling within 24 hours"
  ]
}
```

### **All Three Run in Parallel** (Promise.all)
- Total time: ~5-10 seconds (not 15-30s sequential)
- User already got response, so they don't wait

---

## 🔄 EVENT-DRIVEN PROCESSING

### **Why Async?**
```
BEFORE (Synchronous):
User submits → AI validation (2s) → AI analysis (10s) → Save → Response
TOTAL: 12 seconds (user waits)

AFTER (Event-Driven):
User submits → AI validation (2s) → Save → Response (200ms)
BACKGROUND: AI analysis (10s) → Update DB → Notify NGOs
TOTAL USER WAIT: 2 seconds
```

### **Event Flow:**
```typescript
// 1. Report created
eventEmitter.emit('report.submitted', {
  reportId: '123',
  description: 'Report text',
  incidentType: 'sexual_abuse',
  location: 'Lagos'
});

// 2. AI Service listens
@OnEvent('report.submitted')
async handleReportSubmitted(payload) {
  const analysis = await this.analyzeIncidentUrgency(payload.description);
  
  // 3. Emit analyzed event
  eventEmitter.emit('report.analyzed', {
    reportId: payload.reportId,
    urgency: analysis.urgency,
    classification: analysis.classification
  });
  
  // 4. If urgent, emit urgent event
  if (analysis.urgency === 'critical' || analysis.urgency === 'high') {
    eventEmitter.emit('report.urgent', {
      reportId: payload.reportId,
      urgency: analysis.urgency,
      location: payload.location
    });
  }
}

// 5. Reports Service updates DB
@OnEvent('report.analyzed')
async handleReportAnalyzed(payload) {
  await this.updateReportWithAnalysis(payload);
}

// 6. Notification Service alerts NGOs
@OnEvent('report.urgent')
async handleUrgentReport(payload) {
  await this.sendSMSToNGO(payload);
  await this.sendEmailToNGO(payload);
}
```

---

## 💰 COST BREAKDOWN

### **Per Report:**
| Stage | Model | Cost | Time |
|-------|-------|------|------|
| Spam Validation | GPT-4o-mini | $0.0004 | 1-2s |
| Urgency Analysis | GPT-4 | $0.03 | 5-10s |
| **TOTAL** | | **$0.0304** | **6-12s** |

### **At Scale:**
| Reports/Day | Daily Cost | Monthly Cost |
|-------------|------------|--------------|
| 10 | $0.30 | $9 |
| 100 | $3.04 | $91 |
| 1,000 | $30.40 | $912 |
| 10,000 | $304 | $9,120 |

---

## 🛡️ SAFETY FEATURES

### **1. Fallback Mechanisms**
```typescript
if (!this.openai) {
  // No API key → Use rule-based validation
  return this.ruleBasedValidation(description);
}

try {
  // Try OpenAI
  return await this.openai.chat.completions.create(...);
} catch (error) {
  // OpenAI fails → Assume valid (don't block real reports)
  return { isValid: true, status: 'VALID', confidence: 50 };
}
```

### **2. Retry Mechanism**
- If AI analysis fails → Add to retry queue
- Retry 3 times with 5-second delay
- Prevents lost reports

### **3. Audit Logging**
- Every AI call logged
- Track success/failure rates
- Monitor costs

---

## 🎯 KEY DESIGN DECISIONS

### **Why Two Stages?**
1. **Stage 1 (Validation):** Fast + cheap → Block spam early
2. **Stage 2 (Analysis):** Slow + expensive → Only for valid reports

### **Why GPT-4o-mini for Validation?**
- 10x cheaper than GPT-4
- Fast enough for real-time
- Accurate enough for spam detection

### **Why GPT-4 for Analysis?**
- More accurate for complex reasoning
- Better at extracting structured data
- Worth the cost for critical cases

### **Why Parallel AI Calls?**
```
Sequential: 5s + 5s + 5s = 15 seconds
Parallel: max(5s, 5s, 5s) = 5 seconds
```

### **Why Event-Driven?**
- User doesn't wait for AI
- System can handle 1000s of concurrent reports
- Failures don't block users

---

## 📊 MONITORING

### **Key Metrics to Track:**
```typescript
// AI Performance
- Validation accuracy (% spam caught)
- Analysis completion rate
- Average processing time
- Cost per report

// System Health
- Event queue size
- Retry queue size
- Failed AI calls
- Response times
```

---

## 🔧 CONFIGURATION

### **Environment Variables:**
```bash
OPENAI_API_KEY=sk-...           # Required for AI
USE_HYBRID_AI_SERVICE=false     # Feature flag
```

### **Models Used:**
- **Validation:** `gpt-4o-mini` (cheap, fast)
- **Analysis:** `gpt-4` (accurate, expensive)

### **Temperature Settings:**
- **Validation:** 0.2 (deterministic)
- **Analysis:** 0.7 (creative but consistent)

---

## 🚀 FUTURE IMPROVEMENTS

### **Phase 2: Fine-Tuned Model**
- Train custom model on Nigerian GBV data
- Reduce cost by 10x
- Improve cultural accuracy

### **Phase 3: Local AI**
- Run smaller model locally (privacy)
- Zero API costs
- Offline support

### **Phase 4: Multi-Modal**
- Analyze uploaded images/videos
- Voice-to-text for audio reports
- OCR for document evidence

---

## 📝 SUMMARY

**Your AI service is:**
- ✅ **Two-stage** (validation → analysis)
- ✅ **Event-driven** (non-blocking)
- ✅ **Cost-effective** ($0.03/report)
- ✅ **Resilient** (fallbacks + retries)
- ✅ **Scalable** (handles 1000s/day)

**It does:**
1. Blocks spam (saves resources)
2. Analyzes urgency (prioritizes critical cases)
3. Extracts structured data (for NGOs)
4. Generates action plans (guides response)
5. Runs in background (instant user feedback)

**Perfect for production!** 🎯
