import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUserDto';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from "bcryptjs"
import { UserResponseDto } from './dtos/userResponseDto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>
      ) {}
    
    async findOne(username:string): Promise <any>{
        return await this.userModel.findOne({ username })
    }

    async createUser(createUserDto: CreateUserDto): Promise <UserResponseDto> {
     const { username, password, role } = createUserDto

     //check if the user already exists
     const existingUser = await this.findOne(username)
     if(existingUser){
        throw new BadRequestException('username already exist')
     }

    // Hash the password before saving
     const password_hash = await bcrypt.hash(password, 10)

     //create a newUser document
     const newUser = new this.userModel({
        username, 
        password_hash,
        role
    })
    
    // save a newUser document
    const savedUser = await newUser.save()

    //return userResponse without password
     return {
        id: savedUser.id,
        username: savedUser.username,
        role:savedUser.role,
        created_at: savedUser.created_at.toISOString(),
        updated_at: savedUser.updated_at.toISOString(),
    }
 }

   
  // validate user
  async validate(username:string, password:any): Promise<{ access_token: string }> {

    // Find user by username
    const user = await this.findOne(username );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare the hashed password
    const passwordMatches = await bcrypt.compare(password, user.password_hash );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
