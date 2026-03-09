import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { QuestionsService } from './questions.service';
import { Question, QuestionSchema } from './shemas/questions.schema';
import { QuestionsController } from './questions.controller';
import { AIChatbotService } from './ai-chatbot.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  providers: [QuestionsService, AIChatbotService],
  controllers: [QuestionsController],
  exports: [AIChatbotService],
})
export class QuestionsModule {}
