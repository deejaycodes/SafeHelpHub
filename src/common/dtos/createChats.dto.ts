import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateChatMessageDto {
  @ApiProperty({
    description: 'The message sender (user or customer service)',
    required: true,
  })
  @IsNotEmpty()
  sender: string;

  @ApiProperty({ description: 'The message content', required: true })
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'User ID (if logged in)', required: false })
  userId?: string;

  @ApiProperty({ description: 'Session ID (if anonymous)', required: false })
  sessionId?: string;
}
