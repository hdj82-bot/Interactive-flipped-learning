import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateGoogleUserData {
  email: string;
  name: string;
  googleSub: string;
  role: UserRole;
  school?: string;
  department?: string;
  studentNumber?: string;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByGoogleSub(googleSub: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleSub } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createFromGoogle(data: CreateGoogleUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
