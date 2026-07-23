import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * يحدد الأدوار المسموح لها بالوصول لهذا الـ endpoint
 * مثال: @Roles(Role.DOCTOR, Role.SECRETARY)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
