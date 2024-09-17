import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'john_doe',
  })
  @IsString()
  @Prop({ required: true, unique: true })
  username: string;

  @ApiProperty({
    description: 'Unique email for the user',
    example: 'john_doe@example.com',
  })
  @IsString()
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({
    description: 'Hashed password for the user',
    example: 'hashedpassword123',
  })
  @IsString()
  @Prop({ required: true })
  password_hash: string;

  @ApiProperty({
    description: 'Role of the user, can be user, support, or admin',
    enum: ['user', 'support', 'admin'],
    example: 'user',
  })
  @IsEnum(['user', 'support', 'admin'])
  @Prop({ required: true, enum: ['user', 'support', 'admin'], default: 'user' })
  role: string;

  @ApiProperty({
    description: 'Date when the user was created',
    example: '2024-09-16T10:15:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @ApiProperty({
    description: 'Date when the user was last updated',
    example: '2024-09-16T10:15:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}


export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save middleware to convert username and email to lowercase
UserSchema.pre<UserDocument>('save', function (next) {
  this.username = this.username.toLowerCase();
  this.email = this.email.toLowerCase();
  next();
});

// Ensure case-insensitive unique indexes for username and email
UserSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
UserSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
