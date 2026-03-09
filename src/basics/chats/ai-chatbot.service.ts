import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIChatbotService {
  private readonly logger = new Logger(AIChatbotService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(userMessage: string): Promise<string> {
    try {
      const systemPrompt = `You are a compassionate support assistant for SafeVoice, a platform helping victims of domestic violence, FGM, and harassment. 
      
Your role:
- Provide empathetic, supportive responses
- Guide users on how to report incidents safely
- Explain available resources (NGOs, shelters, legal aid)
- Offer emotional support and validation
- Maintain confidentiality and anonymity
- Never judge or blame victims
- Provide crisis hotline numbers when appropriate

Keep responses concise, clear, and actionable.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      return 'I apologize, but I am having trouble responding right now. Please try again or contact emergency services if you are in immediate danger.';
    }
  }

  async analyzeIncidentUrgency(incidentText: string): Promise<{
    urgency: 'urgent' | 'moderate' | 'low';
    classification: string;
    extractedEntities: {
      location?: string;
      incidentType?: string;
      timeframe?: string;
    };
    recommendedActions: string[];
  }> {
    try {
      const analysisPrompt = `Analyze this incident report and provide:
1. Urgency level (urgent/moderate/low)
2. Incident classification (domestic violence, FGM, harassment, etc.)
3. Extracted entities (location, incident type, timeframe)
4. Recommended actions

Incident: "${incidentText}"

Respond in JSON format:
{
  "urgency": "urgent|moderate|low",
  "classification": "incident type",
  "extractedEntities": {
    "location": "extracted location or null",
    "incidentType": "specific type",
    "timeframe": "when it occurred or null"
  },
  "recommendedActions": ["action1", "action2"]
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      this.logger.error(`Incident analysis error: ${error.message}`);
      return {
        urgency: 'moderate',
        classification: 'general incident',
        extractedEntities: {},
        recommendedActions: ['Contact local authorities', 'Seek medical attention if needed'],
      };
    }
  }
}
