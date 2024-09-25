// src/questions/questions.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions() {
    return this.questionsService.getAllQuestions();
  }

  @Get(':id')
  async getQuestion(@Param('id') id: string) {
    return this.questionsService.getAnswerForQuestion(id);
  }
}
