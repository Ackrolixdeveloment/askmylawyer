import { HttpStatus, Injectable } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { AdminStatus, Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminAlertsService } from '../admin-alerts/admin-alerts.service';
import { AdminEventsService } from '../admin-alerts/admin-events.service';
import {
  CategoryDto,
  CreateAdminUserDto,
  DepartmentDto,
  RoleDto,
  UpdateAdminUserDto,
} from './dto/directory.dto';
import {
  ACCESS_LEVELS,
  AccessLevel,
  emptyPermissions,
  normalisePermissions,
  PERMISSION_KEYS,
  PERMISSION_MODULES,
} from './permission-catalogue';

const isoDate = (value: Date) => value.toISOString().slice(0, 10);

const notFound = (what: string) =>
  new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', `${what} not found.`);

const inUse = (message: string) =>
  new AppException(HttpStatus.CONFLICT, 'IN_USE', message);

/** Postgres raises this when a unique index is violated. */
const isDuplicate = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const duplicate = (message: string) =>
  new AppException(HttpStatus.CONFLICT, 'DUPLICATE', message);

/** Says what an administrator actually changed, for the notification. */
function describeChange(dto: UpdateAdminUserDto) {
  const changed: string[] = [];
  if (dto.name) changed.push('name');
  if (dto.email) changed.push('email address');
  if (dto.phone) changed.push('phone number');
  if (dto.roleId) changed.push('role');
  if (dto.password) changed.push('password');
  if (dto.status) changed.push('account status');

  return changed.length > 0
    ? `An administrator updated your ${changed.join(', ')}.`
    : 'An administrator updated your account details.';
}

/** "Today", "Yesterday", "3 days ago" — how the users table reads. */
function lastActive(value: Date | null) {
  if (!value) return 'Never';

  const days = Math.floor((Date.now() - value.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return isoDate(value);
}

/**
 * The admin team itself: departments, ticket categories, roles, the people
 * who sign in, and what each of them can reach.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: AdminEventsService,
    private readonly alerts: AdminAlertsService,
  ) {}

  // ---- Departments ----

  async listDepartments() {
    const rows = await this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { roles: true, categories: true } } },
    });

    // Members are counted through roles, which is where people are attached.
    const members = await this.prisma.adminUser.groupBy({
      by: ['roleId'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const roles = await this.prisma.role.findMany({
      select: { id: true, departmentId: true },
    });
    const perDepartment = new Map<string, number>();
    for (const group of members) {
      const departmentId = roles.find((role) => role.id === group.roleId)?.departmentId;
      if (!departmentId) continue;
      perDepartment.set(departmentId, (perDepartment.get(departmentId) ?? 0) + group._count._all);
    }

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description ?? '',
        members: perDepartment.get(row.id) ?? 0,
        status: row.status,
      })),
    };
  }

  async createDepartment(dto: DepartmentDto) {
    try {
      const row = await this.prisma.department.create({ data: { ...dto } });
      return { id: row.id };
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('A department with that name or code already exists.');
      throw error;
    }
  }

  async updateDepartment(id: string, dto: DepartmentDto) {
    await this.findDepartment(id);

    try {
      await this.prisma.department.update({ where: { id }, data: { ...dto } });
      return { id };
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('A department with that name or code already exists.');
      throw error;
    }
  }

  async deleteDepartment(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { roles: true, categories: true } } },
    });
    if (!department) throw notFound('Department');

    if (department._count.roles > 0 || department._count.categories > 0) {
      throw inUse('Move its roles and categories somewhere else before deleting it.');
    }

    await this.prisma.department.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ---- Ticket categories ----

  async listCategories() {
    const rows = await this.prisma.ticketCategory.findMany({
      orderBy: { name: 'asc' },
      include: { department: { select: { name: true } } },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        departmentId: row.departmentId,
        department: row.department.name,
        status: row.status,
      })),
    };
  }

  async createCategory(dto: CategoryDto) {
    await this.findDepartment(dto.departmentId);

    try {
      const row = await this.prisma.ticketCategory.create({ data: { ...dto } });
      return { id: row.id };
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('That category already exists in this department.');
      throw error;
    }
  }

  async updateCategory(id: string, dto: CategoryDto) {
    await this.findDepartment(dto.departmentId);
    const existing = await this.prisma.ticketCategory.findUnique({ where: { id } });
    if (!existing) throw notFound('Category');

    try {
      await this.prisma.ticketCategory.update({ where: { id }, data: { ...dto } });
      return { id };
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('That category already exists in this department.');
      throw error;
    }
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.ticketCategory.findUnique({ where: { id } });
    if (!existing) throw notFound('Category');

    await this.prisma.ticketCategory.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ---- Roles ----

  async listRoles() {
    const rows = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        department: { select: { name: true } },
        _count: { select: { admins: true } },
      },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        departmentId: row.departmentId,
        department: row.department?.name ?? '',
        description: row.description ?? '',
        users: row._count.admins,
        status: row.status,
        isSystem: row.isSystem,
      })),
    };
  }

  async createRole(dto: RoleDto) {
    if (dto.departmentId) await this.findDepartment(dto.departmentId);

    try {
      const row = await this.prisma.role.create({ data: { ...dto } });
      return { id: row.id };
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('A role with that name already exists.');
      throw error;
    }
  }

  async updateRole(id: string, dto: RoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw notFound('Role');
    // Renaming or reassigning Super Admin would undo the protection that
    // hangs off it, so the built-in roles are read-only.
    if (role.isSystem) throw inUse('Built-in roles cannot be edited.');
    if (dto.departmentId) await this.findDepartment(dto.departmentId);

    try {
      await this.prisma.role.update({ where: { id }, data: { ...dto } });
      return { id };
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('A role with that name already exists.');
      throw error;
    }
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { admins: true } } },
    });
    if (!role) throw notFound('Role');
    if (role.isSystem) throw inUse('Built-in roles cannot be deleted.');
    if (role._count.admins > 0) {
      throw inUse('Move its users to another role before deleting it.');
    }

    await this.prisma.role.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ---- Admin users ----

  async listUsers() {
    const rows = await this.prisma.adminUser.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { role: { select: { id: true, name: true, isSystem: true } } },
    });

    return { data: rows.map((row) => this.toUser(row)) };
  }

  async getUser(id: string) {
    const row = await this.prisma.adminUser.findFirst({
      where: { id, deletedAt: null },
      include: { role: { select: { id: true, name: true, isSystem: true } } },
    });
    if (!row) throw notFound('User');

    return this.toUser(row);
  }

  async createUser(dto: CreateAdminUserDto) {
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw notFound('Role');
    await this.assertRoleAssignable(role);

    try {
      const row = await this.prisma.adminUser.create({
        data: {
          employeeCode: await this.nextEmployeeCode(),
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          roleId: dto.roleId,
          status: dto.status ?? AdminStatus.active,
          passwordHash: await hash(dto.password),
          // Access is granted afterwards, on the permissions screen.
          permissions: emptyPermissions(),
        },
        include: { role: { select: { id: true, name: true, isSystem: true } } },
      });

      return this.toUser(row);
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('Someone already signs in with that email.');
      throw error;
    }
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await this.prisma.adminUser.findFirst({
      where: { id, deletedAt: null },
      include: { role: { select: { id: true, name: true, isSystem: true } } },
    });
    if (!user) throw notFound('User');

    if (dto.roleId && dto.roleId !== user.roleId) {
      // The Super Admin keeps the keys: their own role cannot be swapped out,
      // and nobody else can be moved into it.
      if (user.role.isSystem) {
        throw inUse(`A ${user.role.name} cannot be moved to another role.`);
      }

      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) throw notFound('Role');
      await this.assertRoleAssignable(role);
    }

    try {
      const row = await this.prisma.adminUser.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          roleId: dto.roleId,
          status: dto.status,
          ...(dto.password ? { passwordHash: await hash(dto.password) } : {}),
        },
        include: { role: { select: { id: true, name: true, isSystem: true } } },
      });

      // A suspended admin should not stay signed in.
      if (dto.status === AdminStatus.inactive) await this.endSessions(id);
      this.events.publish(id, 'permissions');

      await this.alerts.notifyOne(id, {
        module: 'dashboard',
        title: 'Your account was updated',
        body: describeChange(dto),
        link: '/notifications/alerts',
      });

      return this.toUser(row);
    } catch (error) {
      if (isDuplicate(error)) throw duplicate('Someone already signs in with that email.');
      throw error;
    }
  }

  /** Soft delete: the account keeps its history but can no longer sign in. */
  async deleteUser(id: string, actingAdminId: string) {
    if (id === actingAdminId) {
      throw inUse('You cannot delete the account you are signed in with.');
    }

    const user = await this.prisma.adminUser.findFirst({
      where: { id, deletedAt: null },
      include: { role: { select: { name: true, isSystem: true } } },
    });
    if (!user) throw notFound('User');

    // Losing every Super Admin would leave nobody able to run the panel.
    if (user.role.isSystem) {
      throw inUse(`A ${user.role.name} account cannot be deleted.`);
    }

    await this.prisma.adminUser.update({
      where: { id },
      data: { deletedAt: new Date(), status: AdminStatus.inactive },
    });
    await this.endSessions(id);

    return { id, deleted: true };
  }

  // ---- Permissions ----

  /** The catalogue the matrix is drawn from. */
  catalogue() {
    return { modules: PERMISSION_MODULES, levels: ACCESS_LEVELS };
  }

  async getPermissions(id: string) {
    const user = await this.getUser(id);
    const row = await this.prisma.adminUser.findUnique({
      where: { id },
      select: { permissions: true },
    });

    return { user, permissions: normalisePermissions(row?.permissions) };
  }

  /** Access is set per person, so this replaces the whole matrix. */
  async setPermissions(id: string, submitted: Record<string, string>) {
    await this.getUser(id);

    const unknown = Object.keys(submitted).filter((key) => !PERMISSION_KEYS.has(key));
    if (unknown.length > 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'UNKNOWN_PERMISSION',
        `Not a known permission: ${unknown.join(', ')}.`,
      );
    }

    const badLevel = Object.entries(submitted).find(
      ([, level]) => !ACCESS_LEVELS.includes(level as AccessLevel),
    );
    if (badLevel) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'UNKNOWN_ACCESS_LEVEL',
        `"${badLevel[1]}" is not an access level.`,
      );
    }

    const permissions = normalisePermissions(submitted);
    await this.prisma.adminUser.update({ where: { id }, data: { permissions } });

    // Their open panel picks the change up without a refresh.
    this.events.publish(id, 'permissions');
    await this.alerts.notifyOne(id, {
      module: 'dashboard',
      title: 'Your access was updated',
      body: 'An administrator changed which parts of the panel you can open.',
      link: '/notifications/alerts',
    });

    return { id, permissions };
  }

  // ---- Helpers ----

  /** Only one person may hold a built-in role such as Super Admin. */
  private async assertRoleAssignable(role: { id: string; name: string; isSystem: boolean }) {
    if (!role.isSystem) return;

    const holder = await this.prisma.adminUser.findFirst({
      where: { roleId: role.id, deletedAt: null },
      select: { name: true },
    });
    if (holder) {
      throw inUse(`${holder.name} is already the ${role.name}; there can only be one.`);
    }
  }

  private async findDepartment(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw notFound('Department');
    return department;
  }

  private endSessions(adminUserId: string) {
    return this.prisma.adminSession.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** EMP-0001, EMP-0002, … including accounts that were deleted. */
  private async nextEmployeeCode() {
    const last = await this.prisma.adminUser.findFirst({
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });

    const previous = Number(last?.employeeCode?.replace(/\D/g, '') ?? 0);
    return `EMP-${String(previous + 1).padStart(4, '0')}`;
  }

  private toUser(row: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    phone: string | null;
    status: AdminStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    role: { id: string; name: string; isSystem: boolean };
  }) {
    return {
      id: row.id,
      employeeCode: row.employeeCode,
      name: row.name,
      email: row.email,
      phone: row.phone ?? '',
      roleId: row.role.id,
      role: row.role.name,
      /** Built-in roles (Super Admin) are protected from deletion. */
      isSystemRole: row.role.isSystem,
      lastActive: lastActive(row.lastLoginAt),
      createdAt: isoDate(row.createdAt),
      lastUpdated: isoDate(row.updatedAt),
      status: row.status,
    };
  }
}
