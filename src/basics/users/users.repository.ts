import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import { User } from '../../common/entities/user.entity';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { IncidentType } from 'src/common/entities/incident-type.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(IncidentType) private incidentRepository: Repository<IncidentType>
  ) {}

  async createUser(createUserDto: CreateUserDto | CreateNgoDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async createNgo(createNgoDto: CreateNgoDto): Promise<User> {
    const ngo = this.userRepository.create(createNgoDto);
    return await this.userRepository.save(ngo);
  }

  async findUserByCriteria(criteria: Record<string, any>): Promise<any> {
    return await this.userRepository.findOne({ where: criteria });
  }

  async fetchSingleUserById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async verifyUserEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isVerified = true;
    await this.userRepository.save(user);
  }

  async updateUser(email: string, updateData: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async updateUserProfilePicture(userId: string, filePath: string): Promise<User> {
    const user = await this.fetchSingleUserById(userId);
    user.profilePicture = { file_path: filePath, uploaded_at: new Date() };
    return await this.userRepository.save(user);
  }

  async updateUserFiles(userId: string, files: Array<{ file_path: string; uploaded_at: Date }>): Promise<User> {
    const user = await this.fetchSingleUserById(userId);
    user.files = files;
    return await this.userRepository.save(user);
  }

  async findAllNgos(): Promise<User[]> {
    return await this.userRepository.find({ where: { role: 'ngo' } });
  }

  async findNgosByIncidentType(incidentTypeId: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'ngo' })
      .andWhere(':incidentType = ANY(user.incident_types_supported)', { incidentType: incidentTypeId })
      .getMany();
  }

  async findNgosByLocation(state: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'ngo' })
      .andWhere("user.primary_location->>'state' = :state", { state })
      .getMany();
  }

  async updateNgoReportStats(userId: string, stats: Partial<User>): Promise<User> {
    const user = await this.fetchSingleUserById(userId);
    Object.assign(user, stats);
    return await this.userRepository.save(user);
  }

  async findUserByIdAndUpdate(userId: string, updateData: Partial<User>): Promise<User> {
    const user = await this.fetchSingleUserById(userId);
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }

  async deleteUserById(userId: string): Promise<void> {
    await this.deleteUser(userId);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findNgoByLocationOrName(query: any): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.where('user.role = :role', { role: 'ngo' });
    
    if (query.location) {
      queryBuilder.andWhere("user.primary_location->>'state' = :location", { location: query.location });
    }
    
    if (query.name) {
      queryBuilder.andWhere('user.ngo_name ILIKE :name', { name: `%${query.name}%` });
    }
    
    return await queryBuilder.getMany();
  }
}
