import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIChatbotService {
  private readonly logger = new Logger(AIChatbotService.name);
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — using simulated AI responses');
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    if (!this.openai) return this.simulateChatResponse(userMessage);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: `You are a compassionate support assistant for SafeVoice, a platform helping victims of domestic violence, FGM, and harassment. Provide empathetic, supportive responses. Guide users on reporting incidents safely. Explain available resources. Offer emotional support. Maintain confidentiality. Never judge victims. Provide crisis hotline numbers when appropriate. Keep responses concise and actionable.` },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      return completion.choices[0].message.content;
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      return this.simulateChatResponse(userMessage);
    }
  }

  async analyzeIncidentUrgency(incidentText: string): Promise<{
    urgency: 'urgent' | 'moderate' | 'low';
    classification: string;
    extractedEntities: { location?: string; incidentType?: string; timeframe?: string };
    recommendedActions: string[];
  }> {
    if (!this.openai) return this.simulateAnalysis(incidentText);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: `Analyze this incident report and provide:\n1. Urgency level (urgent/moderate/low)\n2. Incident classification\n3. Extracted entities (location, incident type, timeframe)\n4. Recommended actions\n\nIncident: "${incidentText}"\n\nRespond in JSON format:\n{"urgency":"urgent|moderate|low","classification":"incident type","extractedEntities":{"location":"extracted location or null","incidentType":"specific type","timeframe":"when it occurred or null"},"recommendedActions":["action1","action2"]}` }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      this.logger.error(`Incident analysis error: ${error.message}`);
      return this.simulateAnalysis(incidentText);
    }
  }

  private simulateChatResponse(message: string): string {
    const msg = message.toLowerCase();

    if (msg.includes('help') || msg.includes('urgent') || msg.includes('emergency')) {
      return 'Your safety is our top priority. If you are in immediate danger, please call emergency services at 199 or 112. You can also submit an anonymous report through our platform — no personal details required. Would you like help filing a report, or do you need information about nearby shelters and support services?';
    }
    if (msg.includes('scared') || msg.includes('afraid') || msg.includes('fear')) {
      return 'I hear you, and your feelings are completely valid. Being scared takes courage to admit, and reaching out is a brave step. You are not alone. Here are some things you can do right now: 1) Make sure you are in a safe location. 2) Save emergency numbers (199, 112). 3) Consider telling a trusted friend or family member. Would you like me to help you find local support organizations?';
    }
    if (msg.includes('report') || msg.includes('incident')) {
      return 'You can submit a report anonymously through our app. Go to the Report page, describe what happened in your own words, select your state, and submit. Your identity is protected — we use encryption and never store personal data unless you choose to share it. An NGO in your area will be notified and can begin helping. Would you like to start a report now?';
    }
    if (msg.includes('fgm') || msg.includes('mutilation') || msg.includes('cutting')) {
      return 'FGM is a serious violation of human rights and is illegal in Nigeria under the Violence Against Persons (Prohibition) Act 2015. If you or someone you know is at risk, please report it immediately. Organizations like Women at Risk International Foundation (WARIF) at +234-809-210-0009 can provide immediate support. You can also file an anonymous report here.';
    }
    if (msg.includes('violence') || msg.includes('abuse') || msg.includes('hit') || msg.includes('beat')) {
      return 'I am sorry you are going through this. Domestic violence is never acceptable, and you deserve to be safe. Here are immediate steps: 1) If in danger now, call 199 or 112. 2) Try to reach a safe location. 3) Contact WARIF helpline: +234-809-210-0009 or Project Alert: +234-1-791-3645. You can also submit an anonymous report through our platform for NGO assistance.';
    }
    if (msg.includes('thank')) {
      return 'You are welcome. Remember, you are not alone and support is always available. Do not hesitate to reach out anytime you need help. Stay safe.';
    }

    return 'Thank you for reaching out. I am here to help you with reporting incidents, finding support services, or just listening. You can tell me what is happening, ask about available resources, or start an anonymous report. Everything shared here is confidential. How can I support you today?';
  }

  private simulateAnalysis(text: string): {
    urgency: 'urgent' | 'moderate' | 'low';
    classification: string;
    extractedEntities: { location?: string; incidentType?: string; timeframe?: string };
    recommendedActions: string[];
  } {
    const t = text.toLowerCase();

    let urgency: 'urgent' | 'moderate' | 'low' = 'moderate';
    let classification = 'general incident';
    const recommendedActions: string[] = [];

    if (t.includes('kill') || t.includes('weapon') || t.includes('gun') || t.includes('knife') || t.includes('blood') || t.includes('dying')) {
      urgency = 'urgent';
    } else if (t.includes('hit') || t.includes('beat') || t.includes('abuse') || t.includes('violence') || t.includes('fgm') || t.includes('rape')) {
      urgency = 'urgent';
    } else if (t.includes('threat') || t.includes('harass') || t.includes('stalk') || t.includes('touch')) {
      urgency = 'moderate';
    } else {
      urgency = 'low';
    }

    if (t.includes('fgm') || t.includes('mutilation') || t.includes('cutting') || t.includes('circumcis')) {
      classification = 'Female Genital Mutilation (FGM)';
      recommendedActions.push('Contact WARIF helpline immediately', 'File police report', 'Seek medical attention');
    } else if (t.includes('domestic') || t.includes('partner') || t.includes('husband') || t.includes('wife') || t.includes('spouse')) {
      classification = 'Domestic Violence';
      recommendedActions.push('Ensure victim safety', 'Contact local shelter', 'File police report');
    } else if (t.includes('child') || t.includes('minor') || t.includes('kid') || t.includes('underage')) {
      classification = 'Child Abuse';
      recommendedActions.push('Contact child protection services', 'Ensure child safety', 'Seek medical evaluation');
    } else if (t.includes('harass') || t.includes('sexual') || t.includes('rape') || t.includes('assault') || t.includes('touch')) {
      classification = 'Sexual Harassment/Assault';
      recommendedActions.push('Seek medical attention', 'Preserve evidence', 'File police report');
    } else {
      classification = 'General Safety Concern';
      recommendedActions.push('Contact local authorities', 'Seek support from trusted person');
    }

    recommendedActions.push('Connect with assigned NGO for ongoing support');

    return {
      urgency,
      classification,
      extractedEntities: { incidentType: classification },
      recommendedActions,
    };
  }
}
