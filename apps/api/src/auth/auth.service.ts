import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  departmentId: true,
  department: { select: { id: true, name: true } },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Hesap pasif durumda');
    }
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        departmentId: user.departmentId,
      },
    };
  }

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: userSelect,
    });
  }
}
