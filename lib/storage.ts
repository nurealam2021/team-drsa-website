import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultSiteContent, type SiteContent } from "@/lib/content";
import type { AdminSession, AdminUser, AnalyticsSummary, AuditRecord, Inquiry, InquiryStatus } from "@/lib/models";

const storageRoot = process.env.TEAM_DRSA_STORAGE_DIR
  ? path.resolve(process.env.TEAM_DRSA_STORAGE_DIR)
  : path.join(process.cwd(), "data");

const contentFile = path.join(storageRoot, "site-content.json");
const inquiryFile = path.join(storageRoot, "inquiries.json");

const adminUsersFile = path.join(storageRoot, "admin-users.json");
const adminSessionsFile = path.join(storageRoot, "admin-sessions.json");
const auditFile = path.join(storageRoot, "audit-log.json");

async function ensureStorage() {
  await mkdir(storageRoot, { recursive: true, mode: 0o700 });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureStorage();
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code === "ENOENT") return structuredClone(fallback);
    throw error;
  }
}

let writeQueue: Promise<void> = Promise.resolve();
let mutationQueue: Promise<void> = Promise.resolve();

async function serializedMutation<T>(task: () => Promise<T>): Promise<T> {
  const current = mutationQueue.then(task, task);
  mutationQueue = current.then(() => undefined, () => undefined);
  return current;
}

async function atomicWrite(file: string, value: unknown) {
  const task = async () => {
    await ensureStorage();
    const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temp, file);
  };
  const current = writeQueue.then(task, task);
  writeQueue = current.catch(() => undefined);
  await current;
}

export async function getSiteContent(): Promise<SiteContent> {
  const stored = await readJson<SiteContent | null>(contentFile, null);
  if (!stored) return structuredClone(defaultSiteContent);

  // Preserve forward compatibility if new top-level defaults are introduced later.
  return {
    ...structuredClone(defaultSiteContent),
    ...stored,
    company: { ...defaultSiteContent.company, ...stored.company },
    hero: { ...defaultSiteContent.hero, ...stored.hero },
    about: { ...defaultSiteContent.about, ...stored.about },
  };
}

export async function saveSiteContent(content: SiteContent) {
  await atomicWrite(contentFile, content);
  return content;
}

export async function listInquiries(): Promise<Inquiry[]> {
  const items = await readJson<Inquiry[]>(inquiryFile, []);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createInquiry(input: Omit<Inquiry, "id" | "createdAt" | "updatedAt" | "status">) {
  return serializedMutation(async () => {
    const items = await readJson<Inquiry[]>(inquiryFile, []);
    const now = new Date().toISOString();
    const inquiry: Inquiry = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: "new",
      ...input,
    };
    await atomicWrite(inquiryFile, [inquiry, ...items]);
    return inquiry;
  });
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  return serializedMutation(async () => {
    const items = await readJson<Inquiry[]>(inquiryFile, []);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], status, updatedAt: new Date().toISOString() };
    await atomicWrite(inquiryFile, items);
    return items[index];
  });
}

const analyticsFile = path.join(storageRoot, "analytics.json");

export async function getAnalytics(): Promise<AnalyticsSummary> {
  return readJson<AnalyticsSummary>(analyticsFile, {
    totalPageViews: 0,
    paths: {},
    days: {},
    updatedAt: new Date(0).toISOString(),
  });
}

export async function recordPageView(rawPath: string) {
  return serializedMutation(async () => {
    const cleanPath = rawPath.split("?")[0].slice(0, 240) || "/";
    const data = await getAnalytics();
    const day = new Date().toISOString().slice(0, 10);
    data.totalPageViews += 1;
    data.paths[cleanPath] = (data.paths[cleanPath] || 0) + 1;
    data.days[day] = (data.days[day] || 0) + 1;
    data.updatedAt = new Date().toISOString();
    await atomicWrite(analyticsFile, data);
    return data;
  });
}


export async function listAdminUsersInternal(): Promise<AdminUser[]> {
  return readJson<AdminUser[]>(adminUsersFile, []);
}

export async function saveAdminUsersInternal(users: AdminUser[]) {
  await atomicWrite(adminUsersFile, users);
}

export async function listAdminSessionsInternal(): Promise<AdminSession[]> {
  return readJson<AdminSession[]>(adminSessionsFile, []);
}

export async function saveAdminSessionsInternal(sessions: AdminSession[]) {
  await atomicWrite(adminSessionsFile, sessions);
}

export async function mutateAdminUsers<T>(task: (users: AdminUser[]) => Promise<{ users: AdminUser[]; result: T }> | { users: AdminUser[]; result: T }): Promise<T> {
  return serializedMutation(async () => {
    const users = await readJson<AdminUser[]>(adminUsersFile, []);
    const output = await task(users);
    await atomicWrite(adminUsersFile, output.users);
    return output.result;
  });
}

export async function mutateAdminSessions<T>(task: (sessions: AdminSession[]) => Promise<{ sessions: AdminSession[]; result: T }> | { sessions: AdminSession[]; result: T }): Promise<T> {
  return serializedMutation(async () => {
    const sessions = await readJson<AdminSession[]>(adminSessionsFile, []);
    const output = await task(sessions);
    await atomicWrite(adminSessionsFile, output.sessions);
    return output.result;
  });
}

export async function appendAuditRecord(record: AuditRecord) {
  return serializedMutation(async () => {
    const records = await readJson<AuditRecord[]>(auditFile, []);
    const next = [record, ...records].slice(0, 5000);
    await atomicWrite(auditFile, next);
    return record;
  });
}

export async function listAuditRecords(limit = 200): Promise<AuditRecord[]> {
  const records = await readJson<AuditRecord[]>(auditFile, []);
  return records.slice(0, Math.max(1, Math.min(limit, 1000)));
}
