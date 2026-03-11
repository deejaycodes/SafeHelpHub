import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

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

  async analyzeIncidentUrgency(incidentText: string): Promise<{
    urgency: 'critical' | 'high' | 'medium' | 'low';
    classification: string;
    extractedEntities: { location?: string; incidentType?: string; timeframe?: string };
    recommendedActions: string[];
  }> {
    if (!this.openai) return this.simulateAnalysis(incidentText);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Analyze this FGM/violence incident report and provide:
1. Urgency level (critical/high/medium/low)
2. Incident classification
3. Extracted entities (location, incident type, timeframe)
4. Recommended actions

Incident: "${incidentText}"

Respond in JSON format:
{"urgency":"critical|high|medium|low","classification":"incident type","extractedEntities":{"location":"extracted location or null","incidentType":"specific type","timeframe":"when it occurred or null"},"recommendedActions":["action1","action2"]}`
        }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      this.logger.error(`Incident analysis error: ${error.message}`);
      return this.simulateAnalysis(incidentText);
    }
  }

  private simulateAnalysis(text: string): {
    urgency: 'critical' | 'high' | 'medium' | 'low';
    classification: string;
    extractedEntities: { location?: string; incidentType?: string; timeframe?: string };
    recommendedActions: string[];
  } {
    const t = text.toLowerCase();
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let classification = 'General Incident';
    const recommendedActions: string[] = [];

    // Determine urgency
    if (t.includes('kill') || t.includes('weapon') || t.includes('gun') || t.includes('knife') || t.includes('blood') || t.includes('dying')) {
      urgency = 'critical';
      recommendedActions.push('Contact emergency services immediately (199/112)');
      recommendedActions.push('Ensure victim safety');
    } else if (t.includes('fgm') || t.includes('mutilation') || t.includes('cutting') || t.includes('rape') || t.includes('severe')) {
      urgency = 'critical';
      recommendedActions.push('Medical attention required');
      recommendedActions.push('Contact WARIF: +234-809-210-0009');
    } else if (t.includes('hit') || t.includes('beat') || t.includes('abuse') || t.includes('violence')) {
      urgency = 'high';
      recommendedActions.push('Provide safe shelter');
      recommendedActions.push('Medical assessment');
    } else if (t.includes('threat') || t.includes('harass') || t.includes('stalk')) {
      urgency = 'medium';
      recommendedActions.push('Document all incidents');
      recommendedActions.push('Consider restraining order');
    } else {
      urgency = 'low';
      recommendedActions.push('Provide counseling services');
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

    return {
      urgency,
      classification,
      extractedEntities: {
        incidentType: classification,
      },
      recommendedActions,
    };
  }
}
