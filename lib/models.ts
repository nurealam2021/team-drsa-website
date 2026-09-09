export type InquiryStatus = "new" | "reviewing" | "contacted" | "qualified" | "closed";

export type Inquiry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: InquiryStatus;
  fullName: string;
  email: string;
  organization: string;
  phone: string;
  service: string;
  details: string;
  source: string;
};

export type AnalyticsSummary = {
  totalPageViews: number;
  paths: Record<string, number>;
  days: Record<string, number>;
  updatedAt: string;
};

export type AdminRole =
  | "super_admin"
  | "content_manager"
  | "business_manager"
  | "analyst"
  | "viewer";

export type AdminPermission =
  | "content.read"
  | "content.write"
  | "inquiries.read"
  | "inquiries.write"
  | "analytics.read"
  | "users.manage"
  | "audit.read"
  | "media.manage";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserView = Omit<AdminUser, "passwordHash">;

export type AdminSession = {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type AuditRecord = {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  target: string;
  metadata: Record<string, string | number | boolean | null>;
};
