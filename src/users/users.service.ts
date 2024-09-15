import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUserDto';
import * as bcrypt from "bcryptjs"
import { UserResponseDto } from './dtos/userResponseDto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
    
    async createUser(createUserDto: CreateUserDto): Promise <UserResponseDto> {
     const { username, password, role } = createUserDto

     //check if the user already exists
     const existingUser = await this.usersRepository.findUserByUserName(username)
     if(existingUser){
        throw new BadRequestException('username already exist')
     }

    // Hash the password before saving
     const password_hash = await bcrypt.hash(password, 10)

     //create a newUser document
     const newUser = {
        ...createUserDto, 
        password_hash,
    }
    
    // save a newUser document
    const savedUser = await this.usersRepository.createUser(newUser)

    //return userResponse without password
     return {
        username: savedUser.username,
        role:savedUser.role,
        created_at: savedUser.created_at.toISOString(),
        updated_at: savedUser.updated_at.toISOString(),
    }
 }

  // validate user
  async validate(username:string, password:any): Promise<{ access_token: string }> {

    // Find user by username
    const user = await this.usersRepository.findUserByUserName(username );
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
