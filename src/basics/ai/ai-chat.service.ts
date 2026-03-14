import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const TEMPLATES: Record<string, string> = {
  'safety plan': `Safety Plan Steps:
1. Identify safe places — friend/family, shelter, police station
2. Pack emergency bag — ID, money, phone charger, medications
3. Memorize emergency numbers — 112, 199, local shelter
4. Plan escape route — avoid kitchen/bathroom during conflict
5. Tell a trusted person about the plan
6. Keep important documents accessible`,

  'legal': `Legal Process in Nigeria:
1. File a police report at the nearest station
2. Request a medical examination (free for GBV cases)
3. Contact Legal Aid Council or FIDA for free legal representation
4. Apply for a protection order through the court
5. VAPP Act 2015 covers domestic violence, FGM, and sexual assault
6. NAPTIP handles trafficking and child exploitation cases`,

  'fgm': `FGM Case Response:
1. Assess if the procedure has happened or is being planned
2. If planned — urgent intervention needed, contact NAPTIP
3. If completed — medical referral for complications
4. Psychological support for the survivor
5. Community sensitization to prevent future cases
6. VAPP Act: up to 4 years imprisonment for perpetrators`,

  'child': `Child Protection Response:
1. Assess immediate safety — is the child still in danger?
2. Contact child protection services or NAPTIP
3. Medical examination if physical abuse suspected
4. Temporary safe placement if home is unsafe
5. Child Rights Act protects children under 18
6. Document everything for potential legal proceedings`,

  'next steps': `Recommended Next Steps:
1. Review the case details and AI analysis
2. Attempt to verify the report through field workers
3. Assess urgency and assign to appropriate team member
4. Contact the reporter if they left contact info
5. Coordinate with relevant services (medical, legal, shelter)
6. Document all actions in case notes`,

  'referral': `Referral Letter Template:
Dear [Organization],
We are referring a case of [incident type] reported on [date] in [location].
The survivor requires [services needed].
Urgency level: [urgency].
Please contact us for further details.
Case reference: [report ID]`,
};

@Injectable()
export class AIChatService {
  private openai: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const key = this.config.get('OPENAI_API_KEY');
    if (key) this.openai = new OpenAI({ apiKey: key });
  }

  async answer(question: string, context: { incidentType?: string; urgency?: string; classification?: string; description?: string }): Promise<string> {
    // Try OpenAI first
    if (this.openai) {
      try {
        const res = await this.openai.chat.completions.create({
          model: 'gpt-4',
          max_tokens: 500,
          messages: [
            { role: 'system', content: `You are an AI assistant for NGO case workers in Nigeria handling gender-based violence, FGM, child abuse, and domestic violence cases. Give practical, actionable advice. Be concise. Current case: ${context.classification || context.incidentType || 'Unknown'}, urgency: ${context.urgency || 'unknown'}.` },
            { role: 'user', content: question },
          ],
        });
        return res.choices[0]?.message?.content || this.templateFallback(question);
      } catch {
        return this.templateFallback(question);
      }
    }
    return this.templateFallback(question);
  }

  private templateFallback(question: string): string {
    const q = question.toLowerCase();
    for (const [key, template] of Object.entries(TEMPLATES)) {
      if (q.includes(key)) return template;
    }
    if (q.includes('step') || q.includes('what should') || q.includes('what do')) return TEMPLATES['next steps'];
    if (q.includes('law') || q.includes('court') || q.includes('police') || q.includes('arrest')) return TEMPLATES['legal'];
    if (q.includes('safe') || q.includes('protect') || q.includes('escape')) return TEMPLATES['safety plan'];
    if (q.includes('refer') || q.includes('letter') || q.includes('transfer')) return TEMPLATES['referral'];
    if (q.includes('child') || q.includes('minor') || q.includes('girl') || q.includes('boy')) return TEMPLATES['child'];
    return TEMPLATES['next steps'];
  }
}
