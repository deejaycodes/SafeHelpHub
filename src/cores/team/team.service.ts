import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/common/entities/user.entity';
import { EmailService } from 'src/basics/email/email.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async inviteStaff(ngoId: string, data: { name: string; email: string; role_title?: string }) {
    const ngo = await this.usersRepo.findOne({ where: { id: ngoId } });
    if (!ngo || ngo.role !== 'ngo') throw new ForbiddenException('Only NGO admins can invite staff');

    const existing = await this.usersRepo.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new BadRequestException('A user with this email already exists');

    const tempPassword = randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const staff = this.usersRepo.create({
      admin_name: data.name,
      email: data.email.toLowerCase(),
      password_hash: hashedPassword,
      role: 'staff',
      ngoId: ngoId,
      ngo_name: ngo.ngo_name,
      isVerified: true,
    });
    const saved = await this.usersRepo.save(staff);

    // Send invite email with temp password
    try {
      await this.emailService.sendStaffInviteEmail(data.email, data.name, ngo.ngo_name, tempPassword);
    } catch {}

    return { id: saved.id, name: saved.admin_name, email: saved.email, role: saved.role };
  }

  async getTeam(ngoId: string) {
    return this.usersRepo.find({
      where: { ngoId },
      select: ['id', 'admin_name', 'email', 'role', 'isHandlingReport', 'resolvedReportsCount', 'created_at'],
      order: { created_at: 'ASC' },
    });
  }

  async removeStaff(ngoId: string, staffId: string) {
    const staff = await this.usersRepo.findOne({ where: { id: staffId, ngoId } });
    if (!staff) throw new NotFoundException('Staff member not found');
    await this.usersRepo.remove(staff);
    return { message: 'Staff member removed' };
  }
}
