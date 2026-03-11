import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

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

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — using simulated AI responses');
    }
  }

  async analyzeIncidentUrgency(incidentText: string): Promise<IncidentAnalysis> {
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
}
