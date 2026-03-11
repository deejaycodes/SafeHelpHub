import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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
  confidenceScore?: number;
  processingTimeMs?: number;
  engineUsed?: string;
}

@Injectable()
export class AIAnalysisClientService {
  private readonly logger = new Logger(AIAnalysisClientService.name);
  private readonly useHybridService: boolean;
  private readonly pythonServiceUrl: string;
  private readonly engine: 'openai' | 'local' | 'hybrid';

  constructor(
    private readonly configService: ConfigService,
  ) {
    // Feature flag: USE_HYBRID_AI_SERVICE
    this.useHybridService = this.configService.get('USE_HYBRID_AI_SERVICE') === 'true';
    this.pythonServiceUrl = this.configService.get('PYTHON_AI_SERVICE_URL', 'http://localhost:8000');
    this.engine = this.configService.get('AI_ENGINE', 'hybrid') as 'openai' | 'local' | 'hybrid';
    
    this.logger.log(`AI Service Mode: ${this.useHybridService ? 'Hybrid (Python)' : 'TypeScript'}`);
    this.logger.log(`Engine: ${this.engine}`);
  }

  async analyzeIncidentUrgency(incidentText: string): Promise<IncidentAnalysis> {
    if (this.useHybridService) {
      return this.analyzeWithPythonService(incidentText);
    } else {
      return this.analyzeWithTypeScript(incidentText);
    }
  }

  private async analyzeWithPythonService(text: string): Promise<IncidentAnalysis> {
    try {
      const response = await axios.post(`${this.pythonServiceUrl}/analyze`, {
        text,
        engine: this.engine,
        include_psychological: true,
        include_action_plan: true,
      }, {
        timeout: 30000, // 30 second timeout
      });

      const data = response.data;

      return {
        urgency: data.urgency,
        classification: data.classification,
        extractedEntities: data.extracted_entities,
        recommendedActions: data.recommended_actions,
        immediateDanger: data.immediate_danger,
        medicalAttentionNeeded: data.medical_attention_needed,
        policeInvolvementRecommended: data.police_involvement_recommended,
        recommendedNgoTypes: data.recommended_ngo_types,
        psychologicalState: data.psychological_state,
        actionPlan: data.action_plan,
        confidenceScore: data.confidence_score,
        processingTimeMs: data.processing_time_ms,
        engineUsed: data.engine_used,
      };
    } catch (error) {
      this.logger.error(`Python AI service failed: ${error.message}`);
      this.logger.warn('Falling back to TypeScript analysis');
      return this.analyzeWithTypeScript(text);
    }
  }

  private async analyzeWithTypeScript(text: string): Promise<IncidentAnalysis> {
    // Fallback to simple rule-based analysis
    const t = text.toLowerCase();
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let classification = 'General Incident';
    let immediateDanger = false;
    let medicalAttentionNeeded = false;
    let policeInvolvementRecommended = false;
    const recommendedActions: string[] = [];
    const recommendedNgoTypes: string[] = [];

    // Determine urgency
    if (t.includes('kill') || t.includes('weapon') || t.includes('gun') || t.includes('knife')) {
      urgency = 'critical';
      immediateDanger = true;
      medicalAttentionNeeded = true;
      policeInvolvementRecommended = true;
      recommendedActions.push('Contact emergency services immediately (199/112)');
      recommendedNgoTypes.push('emergency', 'medical', 'legal');
    } else if (t.includes('fgm') || t.includes('mutilation') || t.includes('rape')) {
      urgency = 'critical';
      immediateDanger = true;
      medicalAttentionNeeded = true;
      policeInvolvementRecommended = true;
      recommendedActions.push('Medical attention required immediately');
      recommendedActions.push('Contact WARIF: +234-809-210-0009');
      recommendedNgoTypes.push('medical', 'legal', 'counseling');
    } else if (t.includes('hit') || t.includes('beat') || t.includes('abuse')) {
      urgency = 'high';
      medicalAttentionNeeded = true;
      policeInvolvementRecommended = true;
      recommendedActions.push('Provide safe shelter');
      recommendedActions.push('Medical assessment');
      recommendedNgoTypes.push('shelter', 'medical', 'legal');
    } else if (t.includes('threat') || t.includes('harass')) {
      urgency = 'medium';
      policeInvolvementRecommended = true;
      recommendedActions.push('Document all incidents');
      recommendedNgoTypes.push('legal', 'counseling');
    } else {
      urgency = 'low';
      recommendedActions.push('Provide counseling services');
      recommendedNgoTypes.push('counseling');
    }

    // Classify incident
    if (t.includes('fgm') || t.includes('mutilation')) {
      classification = 'Female Genital Mutilation';
    } else if (t.includes('rape') || t.includes('sexual')) {
      classification = 'Sexual Violence';
    } else if (t.includes('domestic')) {
      classification = 'Domestic Violence';
    } else if (t.includes('child')) {
      classification = 'Child Abuse';
    }

    return {
      urgency,
      classification,
      extractedEntities: { incidentType: classification },
      recommendedActions,
      immediateDanger,
      medicalAttentionNeeded,
      policeInvolvementRecommended,
      recommendedNgoTypes,
      psychologicalState: 'Unable to assess - using fallback analysis',
      actionPlan: recommendedActions,
      engineUsed: 'typescript-fallback',
    };
  }
}
