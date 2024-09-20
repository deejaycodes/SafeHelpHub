import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import { User, UserDocument } from '../../common/schemas/users.schema';
import { Model, Types } from 'mongoose';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
      const objectId =
        typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

      const user = await this.userModel.findById(objectId).exec();

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
}
