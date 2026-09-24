import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard, type AdminRequest } from '../admin-auth/admin-auth.guard';
import { AdminUsersService } from './admin-users.service';
import {
  CategoryDto,
  CreateAdminUserDto,
  DepartmentDto,
  PermissionsDto,
  RoleDto,
  UpdateAdminUserDto,
} from './dto/directory.dto';

/** The admin team: departments, ticket categories, roles and the people. */
@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(private readonly directory: AdminUsersService) {}

  // ---- Departments ----

  @Get('departments')
  listDepartments() {
    return this.directory.listDepartments();
  }

  @Post('departments')
  @HttpCode(201)
  createDepartment(@Body() dto: DepartmentDto) {
    return this.directory.createDepartment(dto);
  }

  @Put('departments/:id')
  updateDepartment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DepartmentDto) {
    return this.directory.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  deleteDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.directory.deleteDepartment(id);
  }

  // ---- Ticket categories ----

  @Get('categories')
  listCategories() {
    return this.directory.listCategories();
  }

  @Post('categories')
  @HttpCode(201)
  createCategory(@Body() dto: CategoryDto) {
    return this.directory.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CategoryDto) {
    return this.directory.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.directory.deleteCategory(id);
  }

  // ---- Roles ----

  @Get('roles')
  listRoles() {
    return this.directory.listRoles();
  }

  @Post('roles')
  @HttpCode(201)
  createRole(@Body() dto: RoleDto) {
    return this.directory.createRole(dto);
  }

  @Put('roles/:id')
  updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RoleDto) {
    return this.directory.updateRole(id, dto);
  }

  @Delete('roles/:id')
  deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.directory.deleteRole(id);
  }

  // ---- Admin users ----

  /** What the permission matrix is drawn from. Before `:id`, so it is not one. */
  @Get('users/permission-catalogue')
  catalogue() {
    return this.directory.catalogue();
  }

  @Get('users')
  listUsers() {
    return this.directory.listUsers();
  }

  @Post('users')
  @HttpCode(201)
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.directory.createUser(dto);
  }

  @Get('users/:id')
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.directory.getUser(id);
  }

  @Put('users/:id')
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminUserDto) {
    return this.directory.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    return this.directory.deleteUser(id, request.admin.id);
  }

  // ---- Permissions, set per person ----

  @Get('users/:id/permissions')
  getPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.directory.getPermissions(id);
  }

  @Put('users/:id/permissions')
  setPermissions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PermissionsDto) {
    return this.directory.setPermissions(id, dto.permissions);
  }
}
