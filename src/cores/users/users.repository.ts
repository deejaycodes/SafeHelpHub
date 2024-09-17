import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import { User, UserDocument } from '../../common/schemas/users.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return await createdUser.save();
  }

  async findUserByUserName(username: string): Promise<any> {
    return await this.userModel.findOne({ username });
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
}
