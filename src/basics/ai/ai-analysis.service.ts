import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import OpenAI from 'openai';
import axios from 'axios';
import { REPORT_EVENTS } from 'src/common/events/event-names';
import { ReportSubmittedEvent, ReportAnalyzedEvent } from 'src/common/events/event-payloads';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RetryService } from 'src/common/services/retry.service';

interface IncidentAnalysis {
  urgency: 'critical' | 'high' | 'medium' | 'low';
  classification: string;
  extractedEntities: {
    location?: string;
    incidentType?: string;
    timeframe?: string;
    victimAge?: number;
    perpetratorRelationship?: string;
  };
  recommendedActions: string[];
  immediateDanger: boolean;
  medicalAttentionNeeded: boolean;
  policeInvolvementRecommended: boolean;
  recommendedNgoTypes: string[];
  psychologicalState?: string;
  actionPlan?: string[];
}

interface ValidationResult {
  isValid: boolean;
  status: 'VALID' | 'SPAM' | 'UNCLEAR';
  reason: string;
  confidence: number;
}

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly retryService: RetryService,
  ) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — using simulated AI responses');
    }
  }

  async analyzeIncidentUrgency(incidentText: string, incidentType?: string): Promise<IncidentAnalysis> {
    // Try Python AI service first
    if (process.env.AI_SERVICE_URL) {
      try {
        this.logger.log('Calling Python AI service...');
        const response = await axios.post(
          `${process.env.AI_SERVICE_URL}/api/v1/analyze`,
          {
            description: incidentText,
            incident_type: incidentType || 'GBV',
            location: ''
          },
          { timeout: 10000 }
        );

        this.logger.log('✅ AI analysis from Python service');
        
        return {
          urgency: response.data.urgency,
          classification: response.data.classification,
          extractedEntities: response.data.extracted_entities || {},
          recommendedActions: response.data.recommended_actions || [],
          immediateDanger: response.data.immediate_danger || false,
          medicalAttentionNeeded: response.data.medical_attention_needed || false,
          policeInvolvementRecommended: response.data.police_involvement_recommended || false,
          recommendedNgoTypes: response.data.recommended_ngo_types || [],
          psychologicalState: response.data.psychological_state,
          actionPlan: response.data.action_plan || []
        };
      } catch (error) {
        this.logger.error(`Python AI service error: ${error.message}`);
        this.logger.warn('Falling back to OpenAI/simulation');
      }
    }

    // Fallback to OpenAI
    if (!this.openai) return this.simulateAnalysis(incidentText);

    try {
      // Multi-agent analysis
      const [structuredData, psychState, actionPlan] = await Promise.all([
        this.extractStructuredData(incidentText),
        this.assessPsychologicalState(incidentText),
        this.generateActionPlan(incidentText),
      ]);

      return {
        ...structuredData,
        psychologicalState: psychState,
        actionPlan: actionPlan,
      };
    } catch (error) {
      this.logger.error(`Incident analysis error: ${error.message}`);
      return this.simulateAnalysis(incidentText);
    }
  }

  /**
   * Validate if report is legitimate or spam
   */
  async validateReport(description: string, incidentType: string): Promise<ValidationResult> {
    if (!this.openai) {
      // Fallback to rule-based validation
      return this.ruleBasedValidation(description);
    }

    try {
      const prompt = `You are a content validator for a GBV/FGM reporting platform in Nigeria.

Analyze this report and classify it as:
- VALID: Real incident report (FGM, child abuse, sexual assault, child labour, domestic violence)
- SPAM: Gibberish, profanity only, trolling, test messages, irrelevant content
- UNCLEAR: Too vague but might be genuine (needs human review)

Incident Type: ${incidentType}
Report: "${description}"

Consider:
- Language barriers (broken English is OK)
- Emotional language (fear, anger is valid)
- Short but urgent messages ("help me" is valid if context exists)
- Cultural context (Nigerian English)

Respond with JSON only:
{
  "status": "VALID" | "SPAM" | "UNCLEAR",
  "reason": "brief explanation",
  "confidence": 0-100
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        isValid: result.status === 'VALID',
        status: result.status,
        reason: result.reason,
        confidence: result.confidence,
      };
    } catch (error) {
      this.logger.error(`Validation error: ${error.message}`);
      // On error, assume valid (don't block legitimate reports)
      return {
        isValid: true,
        status: 'VALID',
        reason: 'validation_error',
        confidence: 50,
      };
    }
  }

  /**
   * Rule-based validation fallback
   */
  private ruleBasedValidation(description: string): ValidationResult {
    const text = description.toLowerCase().trim();
    const wordCount = description.trim().split(/\s+/).length;

    // Check for obvious spam
    const spamPhrases = ['test', 'hello world', 'asdf', 'qwerty'];
    if (spamPhrases.some(phrase => text === phrase)) {
      return {
        isValid: false,
        status: 'SPAM',
        reason: 'Test phrase detected',
        confidence: 95,
      };
    }

    // Check for gibberish
    if (/(.)\1{5,}/.test(description)) {
      return {
        isValid: false,
        status: 'SPAM',
        reason: 'Gibberish detected',
        confidence: 90,
      };
    }

    // Too short but might be valid
    if (wordCount < 5) {
      return {
        isValid: true,
        status: 'UNCLEAR',
        reason: 'Very short report, needs review',
        confidence: 60,
      };
    }

    // Check for incident-related keywords
    const validKeywords = [
      'fgm', 'cut', 'mutilation', 'abuse', 'violence', 'rape', 'assault',
      'beat', 'hit', 'hurt', 'child', 'labour', 'work', 'forced', 'danger',
      'help', 'scared', 'afraid', 'threat', 'harass'
    ];

    const hasValidKeyword = validKeywords.some(keyword => text.includes(keyword));

    if (hasValidKeyword) {
      return {
        isValid: true,
        status: 'VALID',
        reason: 'Contains incident-related keywords',
        confidence: 85,
      };
    }

    // Unclear - needs human review
    return {
      isValid: true,
      status: 'UNCLEAR',
      reason: 'No clear indicators, needs review',
      confidence: 50,
    };
  }

  // Agent 1: Extract structured data using function calling
  private async extractStructuredData(text: string): Promise<Omit<IncidentAnalysis, 'psychologicalState' | 'actionPlan'>> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are an expert analyst for FGM and violence cases in Nigeria. Extract detailed information from incident reports.'
      }, {
        role: 'user',
        content: text
      }],
      tools: [{
        type: "function",
        function: {
          name: "analyze_incident",
          description: "Extract structured data from FGM/violence incident report",
          parameters: {
            type: "object",
            properties: {
              urgency: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
                description: "Urgency level based on immediate danger"
              },
              classification: {
                type: "string",
                description: "Type of incident (FGM, Sexual Violence, Domestic Violence, etc.)"
              },
              victimAge: {
                type: "number",
                description: "Estimated age of victim if mentioned"
              },
              perpetratorRelationship: {
                type: "string",
                description: "Relationship of perpetrator to victim (family, stranger, partner, etc.)"
              },
              location: {
                type: "string",
                description: "Location where incident occurred"
              },
              timeframe: {
                type: "string",
                description: "When the incident occurred"
              },
              immediateDanger: {
                type: "boolean",
                description: "Is victim in immediate danger right now?"
              },
              medicalAttentionNeeded: {
                type: "boolean",
                description: "Does victim need immediate medical attention?"
              },
              policeInvolvementRecommended: {
                type: "boolean",
                description: "Should police be involved?"
              },
              recommendedNgoTypes: {
                type: "array",
                items: { type: "string" },
                description: "Types of NGOs needed (medical, legal, shelter, counseling, etc.)"
              },
              recommendedActions: {
                type: "array",
                items: { type: "string" },
                description: "Immediate actions to take"
              }
            },
            required: ["urgency", "classification", "immediateDanger", "medicalAttentionNeeded", "policeInvolvementRecommended", "recommendedNgoTypes", "recommendedActions"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "analyze_incident" }}
    });

    const functionCall = completion.choices[0].message.tool_calls[0].function;
    const data = JSON.parse(functionCall.arguments);

    return {
      urgency: data.urgency,
      classification: data.classification,
      extractedEntities: {
        location: data.location,
        incidentType: data.classification,
        timeframe: data.timeframe,
        victimAge: data.victimAge,
        perpetratorRelationship: data.perpetratorRelationship,
      },
      recommendedActions: data.recommendedActions,
      immediateDanger: data.immediateDanger,
      medicalAttentionNeeded: data.medicalAttentionNeeded,
      policeInvolvementRecommended: data.policeInvolvementRecommended,
      recommendedNgoTypes: data.recommendedNgoTypes,
    };
  }

  // Agent 2: Assess psychological state
  private async assessPsychologicalState(text: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are a trauma-informed psychologist. Assess the emotional and psychological state of the victim based on their report. Be empathetic and professional.'
      }, {
        role: 'user',
        content: `Assess the psychological state from this report (2-3 sentences):\n\n${text}`
      }],
      temperature: 0.5,
      max_tokens: 150,
    });

    return completion.choices[0].message.content.trim();
  }

  // Agent 3: Generate personalized action plan
  private async generateActionPlan(text: string): Promise<string[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are a crisis response coordinator. Create a step-by-step action plan for NGOs responding to this incident. Be specific and actionable.'
      }, {
        role: 'user',
        content: `Create a 4-6 step action plan for this incident:\n\n${text}\n\nReturn as JSON array of strings.`
      }],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.actionPlan || result.steps || [];
  }

  // Fallback: Rule-based analysis when OpenAI is unavailable
  private simulateAnalysis(text: string): IncidentAnalysis {
    const t = text.toLowerCase();
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let classification = 'General Incident';
    let immediateDanger = false;
    let medicalAttentionNeeded = false;
    let policeInvolvementRecommended = false;
    const recommendedActions: string[] = [];
    const recommendedNgoTypes: string[] = [];

    // Determine urgency and immediate danger
    if (t.includes('kill') || t.includes('weapon') || t.includes('gun') || t.includes('knife') || t.includes('blood') || t.includes('dying')) {
      urgency = 'critical';
      immediateDanger = true;
      medicalAttentionNeeded = true;
      policeInvolvementRecommended = true;
      recommendedActions.push('Contact emergency services immediately (199/112)');
      recommendedActions.push('Ensure victim safety');
      recommendedNgoTypes.push('emergency', 'medical', 'legal');
    } else if (t.includes('fgm') || t.includes('mutilation') || t.includes('cutting') || t.includes('rape') || t.includes('severe')) {
      urgency = 'critical';
      immediateDanger = true;
      medicalAttentionNeeded = true;
      policeInvolvementRecommended = true;
      recommendedActions.push('Medical attention required immediately');
      recommendedActions.push('Contact WARIF: +234-809-210-0009');
      recommendedActions.push('Preserve evidence for legal proceedings');
      recommendedNgoTypes.push('medical', 'legal', 'counseling');
    } else if (t.includes('hit') || t.includes('beat') || t.includes('abuse') || t.includes('violence')) {
      urgency = 'high';
      medicalAttentionNeeded = true;
      policeInvolvementRecommended = true;
      recommendedActions.push('Provide safe shelter');
      recommendedActions.push('Medical assessment');
      recommendedActions.push('Document injuries');
      recommendedNgoTypes.push('shelter', 'medical', 'legal');
    } else if (t.includes('threat') || t.includes('harass') || t.includes('stalk')) {
      urgency = 'medium';
      policeInvolvementRecommended = true;
      recommendedActions.push('Document all incidents');
      recommendedActions.push('Consider restraining order');
      recommendedNgoTypes.push('legal', 'counseling');
    } else {
      urgency = 'low';
      recommendedActions.push('Provide counseling services');
      recommendedNgoTypes.push('counseling');
    }

    // Classify incident
    if (t.includes('fgm') || t.includes('mutilation') || t.includes('cutting')) {
      classification = 'Female Genital Mutilation';
    } else if (t.includes('rape') || t.includes('sexual')) {
      classification = 'Sexual Violence';
    } else if (t.includes('domestic') || t.includes('husband') || t.includes('wife') || t.includes('partner')) {
      classification = 'Domestic Violence';
    } else if (t.includes('child') || t.includes('minor')) {
      classification = 'Child Abuse';
    } else if (t.includes('harass') || t.includes('stalk')) {
      classification = 'Harassment';
    }

    // Extract age if mentioned
    const ageMatch = text.match(/(\d+)\s*(year|yr|yo)/i);
    const victimAge = ageMatch ? parseInt(ageMatch[1]) : undefined;

    // Determine perpetrator relationship
    let perpetratorRelationship = 'unknown';
    if (t.includes('husband') || t.includes('wife') || t.includes('spouse')) {
      perpetratorRelationship = 'spouse';
    } else if (t.includes('father') || t.includes('mother') || t.includes('parent')) {
      perpetratorRelationship = 'parent';
    } else if (t.includes('family') || t.includes('relative')) {
      perpetratorRelationship = 'family member';
    } else if (t.includes('stranger')) {
      perpetratorRelationship = 'stranger';
    } else if (t.includes('boyfriend') || t.includes('girlfriend') || t.includes('partner')) {
      perpetratorRelationship = 'intimate partner';
    }

    return {
      urgency,
      classification,
      extractedEntities: {
        incidentType: classification,
        victimAge,
        perpetratorRelationship,
      },
      recommendedActions,
      immediateDanger,
      medicalAttentionNeeded,
      policeInvolvementRecommended,
      recommendedNgoTypes,
      psychologicalState: 'Unable to assess - AI service unavailable',
      actionPlan: recommendedActions,
    };
  }

  /**
   * Event Listener: Process report analysis asynchronously
   */
  @OnEvent(REPORT_EVENTS.SUBMITTED)
  async handleReportSubmitted(payload: ReportSubmittedEvent) {
    this.logger.log(`Processing report ${payload.reportId} asynchronously`);

    try {
      // Analyze urgency (this happens in background, user already got response)
      const aiAnalysis = await this.analyzeIncidentUrgency(payload.description);

      // Success - remove from retry queue if it was there
      this.retryService.removeFromRetryQueue(payload.reportId);

      // Emit analyzed event with FULL results from Python AI
      this.eventEmitter.emit(REPORT_EVENTS.ANALYZED, {
        reportId: payload.reportId,
        urgency: aiAnalysis.urgency,
        classification: aiAnalysis.classification,
        immediateDanger: aiAnalysis.immediateDanger,
        medicalAttentionNeeded: aiAnalysis.medicalAttentionNeeded,
        policeInvolvementRecommended: aiAnalysis.policeInvolvementRecommended,
        extractedEntities: aiAnalysis.extractedEntities,
        recommendedActions: aiAnalysis.recommendedActions,
        recommendedNgoTypes: aiAnalysis.recommendedNgoTypes,
        psychologicalState: aiAnalysis.psychologicalState,
        actionPlan: aiAnalysis.actionPlan,
      } as ReportAnalyzedEvent);

      this.logger.log(`Report ${payload.reportId} analyzed: ${aiAnalysis.urgency} urgency`);

      // If critical/high urgency, emit urgent event
      if (aiAnalysis.urgency === 'critical' || aiAnalysis.urgency === 'high') {
        this.eventEmitter.emit(REPORT_EVENTS.URGENT, {
          reportId: payload.reportId,
          urgency: aiAnalysis.urgency,
          classification: aiAnalysis.classification,
          location: payload.location,
        });
        this.logger.warn(`URGENT REPORT: ${payload.reportId} - ${aiAnalysis.classification}`);
      }
    } catch (error) {
      this.logger.error(`Failed to analyze report ${payload.reportId}: ${error.message}`);
      
      // Add to retry queue
      this.retryService.addToRetryQueue(payload.reportId, REPORT_EVENTS.SUBMITTED, payload);
    }
  }
}
