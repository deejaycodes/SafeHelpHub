import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all questions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All questions retrieved successfully.',
    schema: {
      example: [
        {
          id: '1',
          question: 'What is the capital of France?',
          answer: 'Paris',
        },
        {
          id: '2',
          question: 'What is the square root of 16?',
          answer: '4',
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
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
    schema: {
      example: {
        id: '1',
        question: 'What is the capital of France?',
        answer: 'Paris',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Question not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Question not found',
      },
    },
  })
  async getQuestion(@Param('id') id: string) {
    return this.questionsService.getAnswerForQuestion(id);
  }
}
