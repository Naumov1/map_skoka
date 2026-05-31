import type { Role, User } from "./types";

export const userRoles = new Set(["Пользователь", "USERS", "Role.USERS"]);
export const adminRoles = new Set(["Администратор", "Сотрудник", "ADMIN", "EMPLOYEE", "Role.ADMIN", "Role.EMPLOYEE"]);

export function normalizeUser(data: unknown): User {
  const value = data as { users?: User; user?: User };
  return value.users || value.user || (data as User);
}

export function normalizeRole(role?: Role) {
  if (!role) return "";
  if (typeof role === "string") return role;
  return role.value || role.name || String(role);
}

export function isUserRole(role?: Role) {
  return userRoles.has(normalizeRole(role));
}

export function isAdminRole(role?: Role) {
  return adminRoles.has(normalRole(role));
}

function normalRole(role?: Role) {
  return normalizeRole(role);
}

export function formatDate(value?: string | null, fallback = "Не назначена") {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString("ru-RU").replace(/\./g, "-");
}

export function declension(num: number) {
  const value = Math.abs(num) % 100;
  const n1 = value % 10;
  if (value > 10 && value < 20) return "заявлений";
  if (n1 > 1 && n1 < 5) return "заявления";
  if (n1 === 1) return "заявление";
  return "заявлений";
}

export function isNotificationRead(notification: { is_read?: boolean; read?: boolean }) {
  return Boolean(notification.is_read ?? notification.read);
}
