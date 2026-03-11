import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../../common/dtos/createUserDto';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { UserResponseDto } from '../../common/dtos/userResponseDto';
import { UsersRepository } from './users.repository';
import { CreateNgoDto } from 'src/common/dtos/createNgoDto';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { VerifyAccountDto } from 'src/common/dtos/verifyDto';
import { SendForgotPasswordCodeDto } from 'src/common/dtos/sendForgotPasswordDto';
import { ValidateResetCodeAndResetPasswordDto } from 'src/common/dtos/validateResetPasswordDto';
import { uploadObject } from 'src/common/utils/upload';
import { User } from 'src/common/entities/user.entity';
import { NigerianStates } from 'src/common/enums/nigeria-states.enum';
import { NgoDto, UpdateNgoDto } from 'src/common/dtos/updateNgoDto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, password } = createUserDto;

    const lowerCaseUsername = username.toLowerCase();
    const lowerCaseEmail = email.toLowerCase();

    //check if the user already exists
    const existingUserByEmail = await this.usersRepository.findUserByCriteria({
      email: lowerCaseEmail,
    });
    const existingUserByUsername = await this.usersRepository.findUserByCriteria({
      username: lowerCaseUsername,
    });
    if (existingUserByEmail || existingUserByUsername) {
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
    const email = createNgoDto.primary_contact.email.toLowerCase();

    // Check if the NGO user already exists
    const existingUser = await this.usersRepository.findUserByCriteria({
      email,
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash the password
    const password_hash = await bcrypt.hash(createNgoDto.password, 10);

    const savedUser = {
      ...createNgoDto,
      password_hash,
      contact_info: {
        primary_contact: {
          ...createNgoDto.primary_contact,
        },
      },
      email,
    };

    return await this.usersRepository.createNgo(savedUser);
  }

  async sendForgotPasswordCode(
    sendForgotPasswordCodeDto: SendForgotPasswordCodeDto,
  ): Promise<{ message: string }> {
    const { email } = sendForgotPasswordCodeDto;

    const user = await this.usersRepository.findUserByCriteria({ email });
    if (!user) {
      throw new NotFoundException('User with this email does not exist.');
    }

    const resetCode = randomInt(1000, 9999).toString();
    const resetCodeExpiresAt = new Date(Date.now() + 60 * 1000);

    await this.usersRepository.updateUser(email, {
      resetCode,
      resetCodeExpiresAt,
    });

    await this.emailService.sendForgotPasswordEmail(email, resetCode);
    return { message: 'Forgot password email sent successfully' };
  }

  async validateResetCodeAndResetPassword(
    validateResetCodeAndResetPasswordDto: ValidateResetCodeAndResetPasswordDto,
  ): Promise<{ message: string }> {
    const { email, resetCode, newPassword } =
      validateResetCodeAndResetPasswordDto;

    const user = await this.usersRepository.findUserByCriteria({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.resetCode || user.resetCode !== resetCode) {
      throw new BadRequestException('Invalid reset code.');
    }

    if (new Date() > new Date(user.resetCodeExpiresAt)) {
      throw new BadRequestException('Reset code has expired.');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await this.usersRepository.updateUser(email, {
      password_hash,
      resetCode: null,
      resetCodeExpiresAt: null,
    });

    return { message: 'Password reset successfully' };
  }

  async verifyAccount(
    verifyAccountDto: VerifyAccountDto,
  ): Promise<{ message: string }> {
    const { email, 'verification-code': verificationCode } = verifyAccountDto;

    const user = await this.usersRepository.findUserByCriteria({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.verificationCode || user.verificationCode !== verificationCode) {
      throw new BadRequestException('Invalid verification code.');
    }

    await this.usersRepository.updateUser(email, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });

    return { message: 'Account verified successfully' };
  }
  async uploadUserProfilePicture(userId: string, file: any): Promise<any> {
    const { originalname, buffer } = file;
    const idFileType = originalname.slice(originalname.lastIndexOf('.'));

    const documentPath = `file-identification/${userId}${idFileType}`;
  
    const uploadResponse = await uploadObject({
      Bucket: 'sportycredit',
      Key: documentPath,
      Body: buffer,
      ACL: 'public-read',
    });
  
    if (uploadResponse?.$metadata?.httpStatusCode === 200) {
      const fileUrl = `${process.env.STORAGE_URL}/${documentPath}`;
  
      const data = await this.usersRepository.updateUserProfilePicture(userId, fileUrl);

      return {
        message: 'profile picture uploaded succesful'
      }
    }
  
    // Throw error if file upload failed
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: 'File upload failed',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  

  async uploadUserFile(userId: string, file: any): Promise<User> {
    const { originalname, buffer } = file;
    const idFileType = originalname.slice(originalname.lastIndexOf('.'));
  
    // Create the document path for the file
    const documentPath = `file-identification/${userId}${idFileType}`;
  
    // Upload the file to the storage bucket
    const uploadResponse = await uploadObject({
      Bucket: 'sportycredit',
      Key: documentPath,
      Body: buffer,
      ACL: 'public-read',
    });
  
    if (uploadResponse?.$metadata?.httpStatusCode === 200) {
      const fileUrl = `${process.env.STORAGE_URL}/${documentPath}`;
  
      const existingUser = await this.usersRepository.fetchSingleUserById(userId);
      const files = existingUser.files || [];
      files.push({ file_path: fileUrl, uploaded_at: new Date() });
      return await this.usersRepository.updateUserFiles(userId, files);
    }
  
    // Throw error if file upload failed
    throw new HttpException(
      {
        status: HttpStatus.BAD_REQUEST,
        error: 'File upload failed',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  
  async findByIdAndUpdate(id: any, updateData: any) {
    return this.usersRepository.findUserByIdAndUpdate(id, updateData);
  }

  async findNgoByLocationOrName(query: { state?: string; name?: string }) {
    return this.usersRepository.findNgoByLocationOrName(query);
  }
  
  async updateNgo(
    userId: string,
    updateNgoDto: UpdateNgoDto,
  ): Promise<any> {
    // Check if the user exists
    const existingNgo = await this.usersRepository.fetchSingleUserById(userId);
    if (!existingNgo) {
      throw new HttpException('NGO not found', HttpStatus.NOT_FOUND);
    }
  
   
    // Prepare updated NGO data
    const updatedNgoData = {
      ...updateNgoDto,
    };
  
    // Save updated details
    const updatedNgo = await this.usersRepository.findUserByIdAndUpdate(userId, updatedNgoData);
  
    return {
      message: "updated successfully"
    };
  }

  async update(
    userId: string,
    updateData: any,
  ): Promise<any> {

    const existingNgo = await this.usersRepository.fetchSingleUserById(userId);
    if (!existingNgo) {
      throw new NotFoundException('NGO not found');
    }
  
  
    const newEmail = updateData.contact_info?.primary_contact?.email;
    const oldEmail = existingNgo.contact_info?.primary_contact?.email;
  
    
    if (newEmail !== oldEmail) {
      updateData.email = newEmail;  
    }
    const updatedNgo = await this.usersRepository.findUserByIdAndUpdate(userId, {
      ngo_name: updateData.ngo_name,
      admin_name: updateData.admin_name,
      registration_number: updateData.registration_number,
      primary_location: updateData.primary_location,
      contact_info: updateData.contact_info, 
      email: updateData.email,
    });
    
    return updatedNgo;
  }
 
 
  async removeUser(id:string) {
    return await this.usersRepository.deleteUserById(id)
  }
  
  async resendVerificationCode(email:string){
    const verificationCode = randomInt(100000, 999999).toString();
    const user = await this.usersRepository.findUserByEmail(email)
    user.verificationCode = verificationCode
    await this.usersRepository.updateUser(email, { verificationCode })
    await this.emailService.sendVerificationEmail(email, verificationCode)

    return {
      message : "verification sent successfully"
     }

}

}