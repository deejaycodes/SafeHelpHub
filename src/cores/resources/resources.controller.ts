import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersRepository } from 'src/basics/users/users.repository';

@ApiTags('Public Resources')
@Controller('resources/ngos')
export class ResourcesController {
  constructor(private readonly usersRepository: UsersRepository) {}

  @Get()
  @ApiOperation({ summary: 'Find NGOs by state (public, no auth)' })
  @ApiQuery({ name: 'state', required: false })
  async findNgos(@Query('state') state?: string) {
    const ngos = state
      ? await this.usersRepository.findNgosByLocation(state)
      : await this.usersRepository.findAllNgos();

    return ngos
      .filter(n => n.isVerified)
      .map(n => ({
        id: n.id,
        name: n.ngo_name,
        state: n.primary_location?.state,
        city: n.primary_location?.city,
        address: n.primary_location?.address,
        phone: n.contact_info?.primary_contact?.phone,
        email: n.contact_info?.primary_contact?.email,
        services: n.services_provided || [],
        incidentTypes: n.incident_types_supported || [],
      }));
  }
}
