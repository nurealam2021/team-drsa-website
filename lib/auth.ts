import "server-only";

import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { AdminPermission, AdminRole, AdminSession, AdminUser, AdminUserView, AuditRecord } from "@/lib/models";
import { hasPermission } from "@/lib/rbac";
import {
  appendAuditRecord,
  listAdminSessionsInternal,
  listAdminUsersInternal,
  mutateAdminSessions,
  mutateAdminUsers,
} from "@/lib/storage";

const scrypt = promisify(scryptCallback);
export const ADMIN_COOKIE = "team_drsa_admin_session";
const SESSION_HOURS = 8;

function sessionSecret() {
  return process.env.ADMIN_SECRET || "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function tokenHash(token: string) {
  const secret = sessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(token).digest("hex");
}

function safeEqualHex(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function toAdminUserView(user: AdminUser): AdminUserView {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function hashPassword(password: string) {
  if (password.length < 12) throw new Error("Admin passwords must be at least 12 characters.");
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  try {
    const [algorithm, saltHex, expectedHex] = encoded.split("$");

    if (
      algorithm !== "scrypt" ||
      !saltHex ||
      !expectedHex ||
      !/^[0-9a-f]+$/i.test(saltHex) ||
      !/^[0-9a-f]+$/i.test(expectedHex)
    ) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const derived = (await scrypt(password, salt, 64)) as Buffer;

    return safeEqualHex(
      derived.toString("hex"),
      expectedHex
    );
  } catch {
    return false;
  }
}

export async function ensureBootstrapAdmin() {
  const users = await listAdminUsersInternal();
  if (users.length > 0) return users[0];

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const secret = sessionSecret();

  if (!email || !password || !secret) {
    return null;
  }

  if (password.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD must contain at least 12 characters."
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "ADMIN_SECRET must contain at least 32 characters."
    );
  }

  const now = new Date().toISOString();
  const user: AdminUser = {
    id: randomUUID(),
    email: normalizeEmail(email),
    name: "Super Admin",
    role: "super_admin",
    passwordHash: await hashPassword(password),
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  return mutateAdminUsers(async (current) => {
    if (current.length > 0) return { users: current, result: current[0] };
    return { users: [user], result: user };
  });
}

export async function adminIsConfigured() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = sessionSecret();

  /*
   * Existing administrator accounts remain valid when storage is healthy.
   * If storage is unavailable during the initial bootstrap check,
   * fall back to the validated environment configuration instead of
   * incorrectly locking the administrator out of the login form.
   */
  try {
    const users = await listAdminUsersInternal();

    if (users.some((user) => user.active)) {
      return secret.length >= 32;
    }
  } catch (error) {
    console.error(
      "[Team DRSA Admin Status]",
      error instanceof Error ? error.message : "Unable to read admin users."
    );
  }

  return Boolean(
    email &&
    password.length >= 12 &&
    secret.length >= 32
  );
}

export async function authenticateAdmin(email: string, password: string) {
  await ensureBootstrapAdmin();
  const users = await listAdminUsersInternal();
  const user = users.find((item) => item.email === normalizeEmail(email) && item.active);
  if (!user) return null;
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

export async function createAdminSession(user: AdminUser) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_HOURS * 60 * 60 * 1000);
  const session: AdminSession = {
    tokenHash: tokenHash(token),
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  await mutateAdminSessions(async (sessions) => {
    const active = sessions.filter((item) => new Date(item.expiresAt).getTime() > now.getTime() && item.userId !== user.id);
    return { sessions: [session, ...active], result: null };
  });

  return { token, expires };
}

export async function revokeAdminSession(token?: string | null) {
  if (!token) return;
  const hash = tokenHash(token);
  await mutateAdminSessions(async (sessions) => ({
    sessions: sessions.filter((item) => item.tokenHash !== hash),
    result: null,
  }));
}

export async function getAdminUserForToken(token?: string | null) {
  if (!token || !sessionSecret()) return null;
  const hash = tokenHash(token);
  const now = Date.now();
  const sessions = await listAdminSessionsInternal();
  const session = sessions.find((item) => item.tokenHash === hash && new Date(item.expiresAt).getTime() > now);
  if (!session) return null;
  const users = await listAdminUsersInternal();
  return users.find((item) => item.id === session.userId && item.active) || null;
}

export async function getCurrentAdminUser() {
  const store = await cookies();
  return getAdminUserForToken(store.get(ADMIN_COOKIE)?.value);
}

export async function getCurrentAdminUserWithPermission(permission: AdminPermission) {
  const user = await getCurrentAdminUser();
  return user && hasPermission(user, permission) ? user : null;
}

export async function listAdminUserViews() {
  return (await listAdminUsersInternal()).map(toAdminUserView).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createAdminUser(input: { email: string; name: string; role: AdminRole; password: string }) {
  const normalized = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const now = new Date().toISOString();
  return mutateAdminUsers(async (users) => {
    if (users.some((user) => user.email === normalized)) throw new Error("An admin user with this email already exists.");
    const user: AdminUser = {
      id: randomUUID(),
      email: normalized,
      name: input.name.trim(),
      role: input.role,
      passwordHash,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    return { users: [...users, user], result: toAdminUserView(user) };
  });
}

export async function updateAdminUser(input: { id: string; role?: AdminRole; active?: boolean; name?: string; password?: string }) {
  const passwordHash = input.password ? await hashPassword(input.password) : null;
  return mutateAdminUsers(async (users) => {
    const index = users.findIndex((user) => user.id === input.id);
    if (index === -1) throw new Error("Admin user not found.");
    const current = users[index];
    const updated: AdminUser = {
      ...current,
      role: input.role ?? current.role,
      active: input.active ?? current.active,
      name: input.name?.trim() || current.name,
      passwordHash: passwordHash ?? current.passwordHash,
      updatedAt: new Date().toISOString(),
    };
    const nextUsers = users.map((user, userIndex) => (userIndex === index ? updated : user));
    const activeSuperAdmins = nextUsers.filter((user) => user.active && user.role === "super_admin").length;
    if (activeSuperAdmins < 1) throw new Error("At least one active Super Admin is required.");
    return { users: nextUsers, result: toAdminUserView(updated) };
  });
}

export async function revokeAdminUserSessions(userId: string) {
  await mutateAdminSessions(async (sessions) => ({
    sessions: sessions.filter((session) => session.userId !== userId),
    result: null,
  }));
}

export async function writeAudit(user: AdminUser | AdminUserView, action: string, target: string, metadata: AuditRecord["metadata"] = {}) {
  return appendAuditRecord({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    actorUserId: user.id,
    actorEmail: user.email,
    action,
    target,
    metadata,
  });
}
