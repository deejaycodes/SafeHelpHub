import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import * as bcrypt from 'bcryptjs';
import { UserResponseDto } from '../../common/dtos/userResponseDto';
import { UsersRepository } from './users.repository';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, password } = createUserDto;

    const lowerCaseUsername = username.toLowerCase();
    const lowerCaseEmail = email.toLowerCase();

    //check if the user already exists
    const existingUser = await this.usersRepository.findUserByCriteria({
      $or: [{ username: lowerCaseUsername }, { email: lowerCaseEmail }],
    });
    if (existingUser) {
      throw new BadRequestException('username or email already exist');
    }

    // Hash the password before saving
    const password_hash = await bcrypt.hash(password, 10);

    //create a newUser document
    const newUser = {
      ...createUserDto,
      password_hash,
    };

    // save a newUser document
    const savedUser = await this.usersRepository.createUser(newUser);

    //return userResponse without password
    return {
      username: savedUser.username,
      role: savedUser.role,
      created_at: savedUser.created_at.toISOString(),
      updated_at: savedUser.updated_at.toISOString(),
    };
  }

  async createNgo(createNgoDto: CreateNgoDto): Promise<any> {
    const email= createNgoDto.contact_info.primary_contact.email.toLowerCase()
   
    // Check if the NGO user already exists
    const existingUser = await this.usersRepository.findUserByCriteria({email});
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
  
    // Hash the password
    const password_hash= await bcrypt.hash(createNgoDto.password, 10);

    const savedUser =  {
      ...createNgoDto,
      password_hash,
      contact_info: {
        primary_contact: {
          ...createNgoDto.contact_info.primary_contact,
        },
        secondary_contact: createNgoDto.contact_info.secondary_contact || {},
      },
      email
    };
  
    return  await this.usersRepository.createNgo(savedUser)
  }
  
}
