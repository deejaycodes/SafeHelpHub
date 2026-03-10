import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import { User, UserDocument } from '../../common/schemas/users.schema';
import { Model, isValidObjectId, Types } from 'mongoose';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { faker } from '@faker-js/faker';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { IncidentType, IncidentTypeDocument } from '../incident/entities/incident.schema';
import { randomInt } from 'crypto';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
  @InjectModel( IncidentType.name) private incidentModel: Model<IncidentTypeDocument>
) {}

  // async onModuleInit() {
  //   await this.cleanupUnverifiedUsers();
  //   // Set an interval to run cleanup every 30 minutes
  //   setInterval(() => this.cleanupUnverifiedUsers(), 30 * 60 * 1000);
  // }

  // private async cleanupUnverifiedUsers() {
  //   const cutoffDate = new Date(Date.now() - 30 * 60 * 1000);
  //   await this.userModel.deleteMany({
  //     isVerified: false,
  //     created_at: { $lt: cutoffDate },
  //   });
  // }

  async createUser(createUserDto: CreateUserDto | CreateNgoDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);

    return await createdUser.save();
  }

  async createNgo(createNgoDto: CreateNgoDto): Promise<User> {
    const createNgo = new this.userModel(createNgoDto);
    return await createNgo.save();
  }

  async findUserByCriteria(criteria: Record<string, any>): Promise<any> {
    return await this.userModel.findOne(criteria);
  }
  async fetchSingleUserById(
    userId: Types.ObjectId | string,
  ): Promise<User | null> {
    try {
      if (!isValidObjectId(userId)) {
        throw new BadRequestException(
          'Invalid ID format. Must be a 24-character hex string.',
        );
      }
      const objectId =
        typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

      const user = await this.userModel.findById(objectId).populate('incident_types_supported', 'name').exec();

      if (!user) {
        throw new NotFoundException(`User with ID ${objectId} not found`);
      }
      return user;
    } catch (error) {
      throw new NotFoundException(`Error fetching user: ${error.message}`);
    }
  }
  async verifyUserEmail(email: string): Promise<void> {
    const user = await this.userModel.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async updateUser(email: string, updateData: any): Promise<User> {
    return this.userModel.findOneAndUpdate({ email }, updateData, {
      new: true,
    });
  }

  async updateUserProfilePicture(
    userId: Types.ObjectId | string,
    filePath: string,
  ): Promise<User> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(
        'Invalid ID format. Must be a 24-character hex string.',
      );
    }
  
    const objectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  
    // Update the profilePicture field with the file path and upload timestamp
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        objectId,
        {
          profilePicture: { file_path: filePath, uploaded_at: new Date() },
        },
        { new: true },
      )
      .exec();
  
    if (!updatedUser) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  
    return updatedUser;
  }
  
  async updateUserFiles(
    userId: Types.ObjectId | string,
    filePath: string,
  ): Promise<User> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException(
        'Invalid ID format. Must be a 24-character hex string.',
      );
    }
    const objectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        objectId,
        {
          $push: {
            files: { file_path: filePath, uploaded_at: new Date() },
          },
        },
        { new: true },
      )
      .exec();
  
    if (!updatedUser) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  
    return updatedUser;
  }
  
  async findNgoByLocationOrName(query?: string): Promise<User[]> {
    const searchQuery: any = { role: 'ngo' };
  
    if (query) {
      const isState = Object.values(NigerianStates).includes(query as NigerianStates);
  
      if (isState) {
        searchQuery['primary_location.state'] = query;
      } else {
        searchQuery.ngo_name = query;
      }
    }
  
    return this.userModel.find(searchQuery)
    .populate('incident_types_supported') 
    .exec();
  }
  
  async findUserByIdAndUpdate(
    userId: Types.ObjectId | string,
    updateData: any,
  ): Promise<User> {
    const objectId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    return this.userModel
      .findOneAndUpdate(objectId, updateData, {
        new: true,
      })
      .exec();
  }

  async deleteUserById(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.userModel.deleteOne({ _id: userId });
    return { message: `User with ID ${userId} deleted successfully` };
  }

  async findUserByEmail(email :string) {
    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user
  }

}