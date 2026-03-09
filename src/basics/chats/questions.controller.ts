import { Controller, Get, Param, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';

@ApiTags('Questions & AI Chatbot')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all questions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All questions retrieved successfully.',
  })
  async getQuestions() {
    return this.questionsService.getAllQuestions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get answer for a specific question' })
  @ApiParam({ name: 'id', description: 'ID of the question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question found and answer retrieved.',
  })
  async getQuestion(@Param('id') id: string) {
    return this.questionsService.getAnswerForQuestion(id);
  }

  @Post('chatbot/ask')
  @ApiOperation({ summary: 'Ask AI chatbot a question (OpenAI GPT-4)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI-generated response',
    schema: {
      example: {
        response: 'I understand you need help. Here are the steps you can take...',
      },
    },
  })
  async askAIChatbot(@Body('message') message: string) {
    return this.questionsService.askAIChatbot(message);
  }
}
