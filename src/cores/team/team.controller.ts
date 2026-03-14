import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TeamService } from './team.service';

@ApiTags('Team Management')
@Controller('team')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Invite a staff member to your NGO' })
  async invite(@Req() req, @Body() body: { name: string; email: string }) {
    return this.teamService.inviteStaff(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List all team members' })
  async list(@Req() req) {
    const ngoId = req.user.role === 'staff' ? req.user.ngoId : req.user.id;
    return this.teamService.getTeam(ngoId);
  }

  @Delete(':staffId')
  @ApiOperation({ summary: 'Remove a staff member' })
  async remove(@Req() req, @Param('staffId') staffId: string) {
    return this.teamService.removeStaff(req.user.id, staffId);
  }
}
