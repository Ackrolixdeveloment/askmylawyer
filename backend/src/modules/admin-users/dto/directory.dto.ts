import { AdminStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const upper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const lower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// ---- Departments ----

export class DepartmentDto {
  @Transform(trim)
  @Length(2, 100)
  name: string;

  @Transform(upper)
  @Length(2, 20)
  code: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 300)
  description?: string;

  @IsOptional()
  @IsEnum(AdminStatus)
  status?: AdminStatus;
}

// ---- Ticket categories ----

export class CategoryDto {
  @Transform(trim)
  @Length(2, 120)
  name: string;

  @IsUUID()
  departmentId: string;

  @IsOptional()
  @IsEnum(AdminStatus)
  status?: AdminStatus;
}

// ---- Roles ----

export class RoleDto {
  @Transform(trim)
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(0, 300)
  description?: string;

  @IsOptional()
  @IsEnum(AdminStatus)
  status?: AdminStatus;
}

// ---- Admin users ----

export class CreateAdminUserDto {
  @Transform(trim)
  @Length(2, 150)
  name: string;

  @Transform(lower)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9]{10,14}$/, { message: 'Enter a valid phone number.' })
  phone?: string;

  @IsUUID('4', { message: 'Choose a role.' })
  roleId: string;

  @Length(8, 72, { message: 'The password needs at least 8 characters.' })
  password: string;

  @IsOptional()
  @IsEnum(AdminStatus)
  status?: AdminStatus;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @Transform(trim)
  @Length(2, 150)
  name?: string;

  @IsOptional()
  @Transform(lower)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9]{10,14}$/, { message: 'Enter a valid phone number.' })
  phone?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  /** Only sent when the admin is resetting it. */
  @IsOptional()
  @Length(8, 72, { message: 'The password needs at least 8 characters.' })
  password?: string;

  @IsOptional()
  @IsEnum(AdminStatus)
  status?: AdminStatus;
}

export class PermissionsDto {
  /** Module or action id → "none" | "read" | "full". */
  @IsObject()
  permissions: Record<string, string>;
}
