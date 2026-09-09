import type { AdminPermission, AdminRole, AdminUser, AdminUserView } from "@/lib/models";

export const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  super_admin: ["content.read", "content.write", "inquiries.read", "inquiries.write", "analytics.read", "users.manage", "audit.read", "media.manage"],
  content_manager: ["content.read", "content.write", "analytics.read", "media.manage"],
  business_manager: ["content.read", "inquiries.read", "inquiries.write", "analytics.read"],
  analyst: ["content.read", "analytics.read"],
  viewer: ["content.read"],
};

export const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  content_manager: "Content Manager",
  business_manager: "Business Manager",
  analyst: "Analyst",
  viewer: "Viewer",
};

export function hasPermission(user: AdminUser | AdminUserView, permission: AdminPermission) {
  return user.active && rolePermissions[user.role].includes(permission);
}
