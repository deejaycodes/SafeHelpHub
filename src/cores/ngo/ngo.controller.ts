import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegisterResponseDto } from 'src/common/dtos/registerResponseDto';
import { NgoService } from './ngo.service';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Ngo')
@Controller('ngo')
export class NgoController {
  constructor(
    private readonly ngoService: NgoService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'signup endpoint' })
  async createUser(
    @Body() createNgoDto: CreateNgoDto,
  ): Promise<RegisterResponseDto> {
    return this.ngoService.registerNgo(createNgoDto);
  }
}
