import { api } from "./api";
import type { AdminUser, Role } from "@/types/user";
import type { Category } from "@/types/category";
import type { Department } from "@/types/department";

// ---- Departments ----

export interface DepartmentInput {
  name: string;
  code: string;
  description?: string;
  status?: Department["status"];
}

export function fetchDepartments() {
  return api<{ data: Department[] }>("/admin/departments");
}

export function createDepartment(input: DepartmentInput) {
  return api<{ id: string }>("/admin/departments", { method: "POST", body: input });
}

export function updateDepartment(id: string, input: DepartmentInput) {
  return api<{ id: string }>(`/admin/departments/${id}`, { method: "PUT", body: input });
}

export function deleteDepartment(id: string) {
  return api<{ id: string }>(`/admin/departments/${id}`, { method: "DELETE" });
}

// ---- Ticket categories ----

export interface CategoryInput {
  name: string;
  departmentId: string;
  status?: Category["status"];
}

export function fetchCategories() {
  return api<{ data: Category[] }>("/admin/categories");
}

export function createCategory(input: CategoryInput) {
  return api<{ id: string }>("/admin/categories", { method: "POST", body: input });
}

export function updateCategory(id: string, input: CategoryInput) {
  return api<{ id: string }>(`/admin/categories/${id}`, { method: "PUT", body: input });
}

export function deleteCategory(id: string) {
  return api<{ id: string }>(`/admin/categories/${id}`, { method: "DELETE" });
}

// ---- Roles ----

export interface RoleInput {
  name: string;
  departmentId?: string;
  description?: string;
  status?: Role["status"];
}

export function fetchRoles() {
  return api<{ data: Role[] }>("/admin/roles");
}

export function createRole(input: RoleInput) {
  return api<{ id: string }>("/admin/roles", { method: "POST", body: input });
}

export function updateRole(id: string, input: RoleInput) {
  return api<{ id: string }>(`/admin/roles/${id}`, { method: "PUT", body: input });
}

export function deleteRole(id: string) {
  return api<{ id: string }>(`/admin/roles/${id}`, { method: "DELETE" });
}

// ---- Admin users ----

export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
  roleId: string;
  password: string;
  status?: AdminUser["status"];
}

export type UpdateUserInput = Partial<CreateUserInput>;

export function fetchAdminUsers() {
  return api<{ data: AdminUser[] }>("/admin/users");
}

export function createAdminUser(input: CreateUserInput) {
  return api<AdminUser>("/admin/users", { method: "POST", body: input });
}

export function updateAdminUser(id: string, input: UpdateUserInput) {
  return api<AdminUser>(`/admin/users/${id}`, { method: "PUT", body: input });
}

export function deleteAdminUser(id: string) {
  return api<{ id: string }>(`/admin/users/${id}`, { method: "DELETE" });
}

// ---- Permissions, set per person ----

export type AccessLevel = "none" | "read" | "full";

export interface PermissionModule {
  id: string;
  label: string;
  actions: { id: string; label: string }[];
}

export type PermissionSet = Record<string, AccessLevel>;

/** The modules and levels the matrix is drawn from. */
export function fetchPermissionCatalogue() {
  return api<{ modules: PermissionModule[]; levels: AccessLevel[] }>(
    "/admin/users/permission-catalogue",
  );
}

export function fetchUserPermissions(id: string) {
  return api<{ user: AdminUser; permissions: PermissionSet }>(
    `/admin/users/${id}/permissions`,
  );
}

export function saveUserPermissions(id: string, permissions: PermissionSet) {
  return api<{ id: string; permissions: PermissionSet }>(
    `/admin/users/${id}/permissions`,
    { method: "PUT", body: { permissions } },
  );
}
