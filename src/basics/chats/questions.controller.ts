import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';

@ApiTags('Questions')  // Group this controller under "Questions"
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all questions' })
  @ApiResponse({ status: 200, description: 'All questions retrieved successfully.' })
  async getQuestions() {
    return this.questionsService.getAllQuestions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get answer for a specific question' })
  @ApiParam({ name: 'id', description: 'ID of the question' })
  @ApiResponse({ status: 200, description: 'Question found and answer retrieved.' })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  async getQuestion(@Param('id') id: string) {
    return this.questionsService.getAnswerForQuestion(id);
  }
}

