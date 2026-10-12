import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function rethrowPrisma(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException('Bu bilgiyle kayıtlı başka bir kayıt var');
    }
    if (error.code === 'P2025') {
      throw new NotFoundException('Kayıt bulunamadı');
    }
  }
  throw error;
}
