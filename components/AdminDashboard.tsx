"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SiteContent } from "@/lib/content";
import type { AdminRole, AdminUserView, AnalyticsSummary, AuditRecord, Inquiry, InquiryStatus } from "@/lib/models";
import { hasPermission, roleLabels } from "@/lib/rbac";

type Tab = "overview" | "content" | "inquiries" | "analytics" | "users" | "audit";
type ModuleKey = "services" | "leadership" | "foundingTeam" | "industries" | "projects" | "caseStudies" | "insights" | "careers" | "support" | "about";
type ServiceItem = SiteContent["services"][number];

const moduleLabels: Array<[ModuleKey, string]> = [
  ["services", "Services"],
  ["leadership", "Leadership"],
  ["foundingTeam", "Founding Team"],
  ["industries", "Industries"],
  ["projects", "Projects"],
  ["caseStudies", "Case Studies"],
  ["insights", "Insights"],
  ["careers", "Careers"],
  ["support", "Support"],
  ["about", "About / Delivery"],
];

const roles: AdminRole[] = ["super_admin", "content_manager", "business_manager", "analyst", "viewer"];

export default function AdminDashboard({ currentUser }: { currentUser: AdminUserView }) {
  const canWriteContent = hasPermission(currentUser, "content.write");
  const canReadInquiries = hasPermission(currentUser, "inquiries.read");
  const canWriteInquiries = hasPermission(currentUser, "inquiries.write");
  const canReadAnalytics = hasPermission(currentUser, "analytics.read");
  const canManageUsers = hasPermission(currentUser, "users.manage");
  const canReadAudit = hasPermission(currentUser, "audit.read");

  const [content, setContent] = useState<SiteContent | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [advancedRaw, setAdvancedRaw] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "viewer" as AdminRole, password: "" });
  const [resetPassword, setResetPassword] = useState<Record<string, string>>({});

  useEffect(() => {
    async function getJson(url: string) {
      const response = await fetch(url, { cache: "no-store" });
      if (response.status === 401) {
        window.location.reload();
        return null;
      }
      return response.ok ? response.json() : null;
    }

    const requests: Promise<unknown>[] = [getJson("/api/admin/content")];
    if (canReadInquiries) requests.push(getJson("/api/admin/inquiries"));
    if (canReadAnalytics) requests.push(getJson("/api/admin/analytics"));
    if (canManageUsers) requests.push(getJson("/api/admin/users"));
    if (canReadAudit) requests.push(getJson("/api/admin/audit"));

    Promise.all(requests)
      .then((responses) => {
        for (const response of responses as Array<Record<string, unknown> | null>) {
          if (!response) continue;
          if (response.content) setContent(response.content as SiteContent);
          if (response.inquiries) setInquiries(response.inquiries as Inquiry[]);
          if (response.analytics) setAnalytics(response.analytics as AnalyticsSummary);
          if (response.users) setUsers(response.users as AdminUserView[]);
          if (response.records) setAudit(response.records as AuditRecord[]);
        }
      })
      .finally(() => setLoading(false));
  }, [canManageUsers, canReadAnalytics, canReadAudit, canReadInquiries]);

  const openInquiries = inquiries.filter((item) => item.status !== "closed").length;
  const filteredInquiries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return inquiries.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!normalized) return true;
      return `${item.fullName} ${item.email} ${item.organization} ${item.service} ${item.details}`.toLowerCase().includes(normalized);
    });
  }, [inquiries, query, statusFilter]);

  async function saveContent() {
    if (!content || !canWriteContent) return;
    setSaving(true);
    setMessage("Saving...");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Save failed.");
      setContent(body.content);
      setMessage("Saved. Public pages now use the updated content.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: InquiryStatus) {
    if (!canWriteInquiries) return;
    const response = await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.message || "Could not update inquiry status.");
      return;
    }
    setInquiries((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  function updateCompany(field: keyof SiteContent["company"], value: string) {
    if (!content || !canWriteContent || field === "name" || field === "shortName") return;
    setContent({ ...content, company: { ...content.company, [field]: value } });
  }

  function updateHero(field: "badge" | "headline" | "description", value: string) {
    if (!content || !canWriteContent) return;
    setContent({ ...content, hero: { ...content.hero, [field]: value } });
  }

  function applyModule(key: ModuleKey, value: unknown) {
    if (!content || !canWriteContent) return;
    setContent({ ...content, [key]: value } as SiteContent);
    setMessage(`${moduleLabels.find(([module]) => module === key)?.[1] ?? key} updated locally. Click Save Changes to publish.`);
  }

  function openAdvanced() {
    if (!content || !canWriteContent) return;
    setAdvancedRaw(JSON.stringify(content, null, 2));
  }

  function applyAdvanced() {
    if (!canWriteContent) return;
    try {
      setContent(JSON.parse(advancedRaw) as SiteContent);
      setMessage("Advanced JSON applied locally. Click Save Changes to validate and publish.");
    } catch {
      setMessage("Advanced JSON has invalid syntax.");
    }
  }

  function exportCsv() {
    if (!canReadInquiries) return;
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Created", "Status", "Name", "Email", "Organization", "Phone", "Service", "Details"],
      ...filteredInquiries.map((item) => [item.createdAt, item.status, item.fullName, item.email, item.organization, item.phone, item.service, item.details]),
    ];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-drsa-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function createUser() {
    setMessage("Creating admin user...");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.message || "Could not create admin user.");
      return;
    }
    setUsers((items) => [...items, body.user as AdminUserView]);
    setNewUser({ name: "", email: "", role: "viewer", password: "" });
    setMessage("Admin user created.");
  }

  async function patchUser(id: string, patch: Partial<{ role: AdminRole; active: boolean; name: string; password: string }>) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.message || "Could not update admin user.");
      return;
    }
    setUsers((items) => items.map((item) => (item.id === id ? (body.user as AdminUserView) : item)));
    setMessage("Admin user updated. Existing sessions for that account were revoked.");
  }

  async function saveResetPassword(userId: string) {
    const password = resetPassword[userId] || "";
    if (password.length < 12) {
      setMessage("New password must be at least 12 characters.");
      return;
    }
    await patchUser(userId, { password });
    setResetPassword((current) => ({ ...current, [userId]: "" }));
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#0A0A0A] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#C1121F]">Team DRSA</p>
            <h1 className="mt-2 text-3xl font-semibold">Website Admin</h1>
            <p className="mt-2 text-sm text-zinc-500">Signed in as {currentUser.name} • {roleLabels[currentUser.role]} • {currentUser.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">View website</Link>
            <button onClick={logout} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Sign out</button>
          </div>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Admin sections">
          <TabButton label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
          {canWriteContent && <TabButton label="Content Studio" active={tab === "content"} onClick={() => setTab("content")} />}
          {canReadInquiries && <TabButton label={`Inquiries (${openInquiries})`} active={tab === "inquiries"} onClick={() => setTab("inquiries")} />}
          {canReadAnalytics && <TabButton label="Analytics" active={tab === "analytics"} onClick={() => setTab("analytics")} />}
          {canManageUsers && <TabButton label="Admin Users" active={tab === "users"} onClick={() => setTab("users")} />}
          {canReadAudit && <TabButton label="Audit Log" active={tab === "audit"} onClick={() => setTab("audit")} />}
        </nav>

        {message && <div role="status" className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">{message}</div>}
        {loading ? <p className="mt-10 text-zinc-400">Loading admin data...</p> : null}

        {!loading && tab === "overview" && content && (
          <section className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Open inquiries" value={canReadInquiries ? openInquiries : "Restricted"} />
              <Metric label="Page views" value={canReadAnalytics ? analytics?.totalPageViews ?? 0 : "Restricted"} />
              <Metric label="Published projects" value={content.projects.filter((item) => item.status === "published").length} />
              <Metric label="Published insights" value={content.insights.filter((item) => item.status === "published").length} />
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Panel title="Content readiness">
                <ReadinessRow label="Canonical company brand" ready={content.company.name === "Team DRSA"} detail="Locked to Team DRSA" />
                <ReadinessRow label="Company email" ready={Boolean(content.company.email)} detail={content.company.email || "Not configured"} />
                <ReadinessRow label="Company phone" ready={Boolean(content.company.phone)} detail={content.company.phone || "Not configured"} />
                <ReadinessRow label="Services" ready={content.services.length > 0} detail={`${content.services.length} configured`} />
                <ReadinessRow label="Leadership" ready={content.leadership.length > 0} detail={`${content.leadership.length} profiles`} />
              </Panel>
              <Panel title="Security controls">
                <p className="text-sm leading-7 text-zinc-400">Admin access uses individual accounts, role-based least privilege, scrypt password hashing, expiring HTTP-only sessions, server-side permission checks, same-origin write protection, and an audit trail.</p>
                <p className="mt-4 text-sm leading-7 text-zinc-400">Your role is <strong className="text-zinc-200">{roleLabels[currentUser.role]}</strong>. Only features permitted for this role are shown.</p>
              </Panel>
            </div>
          </section>
        )}

        {!loading && tab === "content" && content && canWriteContent && (
          <section className="mt-6 space-y-6">
            <Panel title="Company settings">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Company name" value={content.company.name} readOnly />
                <Field label="Short name" value={content.company.shortName} readOnly />
                <Field label="Email" type="email" value={content.company.email} onChange={(value) => updateCompany("email", value)} />
                <Field label="Phone" value={content.company.phone} onChange={(value) => updateCompany("phone", value)} />
                <Field label="Address / delivery location" value={content.company.address} onChange={(value) => updateCompany("address", value)} />
                <Field label="LinkedIn URL" type="url" value={content.company.linkedin} onChange={(value) => updateCompany("linkedin", value)} />
              </div>
              <TextField label="Tagline" value={content.company.tagline} onChange={(value) => updateCompany("tagline", value)} />
              <TextField label="Company description" value={content.company.description} onChange={(value) => updateCompany("description", value)} rows={3} />
            </Panel>

            <Panel title="Homepage hero">
              <TextField label="Badge" value={content.hero.badge} onChange={(value) => updateHero("badge", value)} />
              <TextField label="Headline" value={content.hero.headline} onChange={(value) => updateHero("headline", value)} />
              <TextField label="Description" value={content.hero.description} onChange={(value) => updateHero("description", value)} rows={3} />
            </Panel>

            <Panel title="Services Manager">
              <p className="mb-5 text-sm leading-7 text-zinc-400">
                Manage the services shown on the rotating homepage circle, service cards,
                navigation, search, consultation form, footer, and service detail pages.
                Changes remain local until you click Save Changes.
              </p>

              <ServiceManager
                services={content.services}
                onChange={(services) => {
                  setContent({ ...content, services });
                  setMessage("Services updated locally. Click Save Changes to publish.");
                }}
              />
            </Panel>

            <Panel title="Structured content modules">
              <p className="mb-5 text-sm leading-7 text-zinc-400">Edit each module independently as structured JSON. The server validates the complete model before publishing, including URL safety and unique slugs.</p>
              <div className="space-y-3">
                {moduleLabels.map(([key, label]) => <ModuleEditor key={key} label={label} value={content[key]} onApply={(value) => applyModule(key, value)} />)}
              </div>
            </Panel>

            <Panel title="Advanced full-site JSON">
              <div className="flex flex-wrap gap-2">
                <button onClick={openAdvanced} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Load full JSON</button>
                {advancedRaw && <button onClick={applyAdvanced} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Apply full JSON locally</button>}
              </div>
              {advancedRaw && <textarea value={advancedRaw} onChange={(event) => setAdvancedRaw(event.target.value)} spellCheck={false} className="mt-4 min-h-[48vh] w-full rounded-2xl border border-white/10 bg-black/50 p-5 font-mono text-xs leading-6 text-zinc-200 outline-none focus:border-[#C1121F]" />}
            </Panel>

            <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111]/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
              <button onClick={saveContent} disabled={saving} className="rounded-xl bg-[#C1121F] px-5 py-3 font-bold disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
              <p className="text-sm text-zinc-500">All changes are validated and audit logged before publication.</p>
            </div>
          </section>
        )}

        {!loading && tab === "inquiries" && canReadInquiries && (
          <section className="mt-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, organization, service..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#C1121F]" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as InquiryStatus | "all")} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm">
                <option value="all">All statuses</option>
                {(["new", "reviewing", "contacted", "qualified", "closed"] as InquiryStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button onClick={exportCsv} className="rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5">Export CSV</button>
            </div>
            {!canWriteInquiries && <p className="mt-3 text-sm text-amber-300">Your role has read-only access to inquiries.</p>}
            <div className="mt-4 space-y-4">
              {filteredInquiries.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-zinc-400">No matching consultation requests.</div> : filteredInquiries.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-col justify-between gap-5 md:flex-row">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{item.fullName}</h2>
                        <span className="rounded-full bg-[#C1121F]/15 px-3 py-1 text-xs font-bold text-red-200">{item.service}</span>
                      </div>
                      <p className="mt-2 break-words text-sm text-zinc-400">{item.email}{item.phone ? ` • ${item.phone}` : ""}{item.organization ? ` • ${item.organization}` : ""}</p>
                      <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-300">{item.details}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-600">
                        <span>Received {new Date(item.createdAt).toLocaleString()}</span>
                        <a href={`mailto:${item.email}`} className="text-red-300 hover:text-red-200">Email client</a>
                      </div>
                    </div>
                    <select disabled={!canWriteInquiries} value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as InquiryStatus)} className="h-11 rounded-xl border border-white/10 bg-black px-3 text-sm disabled:opacity-50">
                      {(["new", "reviewing", "contacted", "qualified", "closed"] as InquiryStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && tab === "analytics" && canReadAnalytics && (
          <section className="mt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Total page views" value={analytics?.totalPageViews ?? 0} />
              <Metric label="Tracked public paths" value={analytics ? Object.keys(analytics.paths).length : 0} />
              <Metric label="Today" value={analytics?.days[new Date().toISOString().slice(0, 10)] ?? 0} />
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Panel title="Top pages">
                <div className="space-y-2">
                  {analytics && Object.entries(analytics.paths).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([path, count]) => <div key={path} className="flex justify-between gap-4 rounded-xl bg-black/30 px-4 py-3 text-sm"><span className="break-all">{path}</span><strong>{count}</strong></div>)}
                </div>
              </Panel>
              <Panel title="Recent daily views">
                <div className="space-y-2">
                  {analytics && Object.entries(analytics.days).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).map(([day, count]) => <div key={day} className="flex justify-between gap-4 rounded-xl bg-black/30 px-4 py-3 text-sm"><span>{day}</span><strong>{count}</strong></div>)}
                </div>
              </Panel>
            </div>
            <p className="mt-5 text-xs leading-6 text-zinc-600">Analytics are first-party and aggregate only the requested public path. This implementation does not create advertising identifiers or store visitor IP addresses in analytics data.</p>
          </section>
        )}

        {!loading && tab === "users" && canManageUsers && (
          <section className="mt-6 space-y-6">
            <Panel title="Create admin user">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Name" value={newUser.name} onChange={(value) => setNewUser((current) => ({ ...current, name: value }))} />
                <Field label="Email" type="email" value={newUser.email} onChange={(value) => setNewUser((current) => ({ ...current, email: value }))} />
                <label className="text-sm font-semibold text-zinc-300">Role<select value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as AdminRole }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-[#C1121F]">{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
                <Field label="Temporary password" type="password" value={newUser.password} onChange={(value) => setNewUser((current) => ({ ...current, password: value }))} />
              </div>
              <button onClick={createUser} disabled={!newUser.name || !newUser.email || newUser.password.length < 12} className="mt-4 rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-bold disabled:opacity-50">Create user</button>
            </Panel>

            <Panel title="Admin accounts">
              <div className="space-y-4">
                {users.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  return <article key={user.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                      <div><p className="font-semibold">{user.name}{isSelf ? " (you)" : ""}</p><p className="mt-1 break-all text-sm text-zinc-500">{user.email}</p></div>
                      <select disabled={isSelf} value={user.role} onChange={(event) => patchUser(user.id, { role: event.target.value as AdminRole })} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm disabled:opacity-50">{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select>
                      <button disabled={isSelf} onClick={() => patchUser(user.id, { active: !user.active })} className="rounded-xl border border-white/10 px-4 py-3 text-sm disabled:opacity-50">{user.active ? "Deactivate" : "Activate"}</button>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <input type="password" value={resetPassword[user.id] || ""} onChange={(event) => setResetPassword((current) => ({ ...current, [user.id]: event.target.value }))} placeholder="Set new password (12+ characters)" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[#C1121F]" />
                      <button onClick={() => saveResetPassword(user.id)} className="rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5">Reset password</button>
                    </div>
                    <p className="mt-3 text-xs text-zinc-600">Status: {user.active ? "Active" : "Inactive"} • Updated {new Date(user.updatedAt).toLocaleString()}</p>
                  </article>;
                })}
              </div>
            </Panel>
          </section>
        )}

        {!loading && tab === "audit" && canReadAudit && (
          <section className="mt-6">
            <Panel title="Recent administrative activity">
              <div className="space-y-3">
                {audit.length === 0 ? <p className="text-sm text-zinc-500">No audit events yet.</p> : audit.map((record) => <article key={record.id} className="rounded-xl bg-black/30 px-4 py-3 text-sm"><div className="flex flex-col justify-between gap-1 sm:flex-row"><strong>{record.action}</strong><span className="text-zinc-600">{new Date(record.createdAt).toLocaleString()}</span></div><p className="mt-1 break-all text-zinc-400">{record.actorEmail} → {record.target}</p>{Object.keys(record.metadata).length > 0 && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-zinc-600">{JSON.stringify(record.metadata)}</pre>}</article>)}
              </div>
            </Panel>
          </section>
        )}
      </div>
    </main>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-semibold ${active ? "bg-[#C1121F]" : "bg-white/5 hover:bg-white/10"}`}>{label}</button>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function ReadinessRow({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return <div className="mb-2 flex items-center justify-between gap-4 rounded-xl bg-black/30 px-4 py-3 text-sm"><span>{label}</span><span className={ready ? "text-green-300" : "text-amber-300"}>{ready ? "Ready" : "Needs setup"} • {detail}</span></div>;
}

function Field({ label, value, onChange, readOnly = false, type = "text" }: { label: string; value: string; onChange?: (value: string) => void; readOnly?: boolean; type?: string }) {
  return <label className="text-sm font-semibold text-zinc-300">{label}<input type={type} value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} className={`mt-2 w-full rounded-xl border border-white/10 px-4 py-3 outline-none focus:border-[#C1121F] ${readOnly ? "bg-white/[0.03] text-zinc-500" : "bg-black/40"}`} /></label>;
}

function TextField({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="mt-4 block text-sm font-semibold text-zinc-300">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 leading-7 outline-none focus:border-[#C1121F]" /></label>;
}

function ServiceManager({
  services,
  onChange,
}: {
  services: SiteContent["services"];
  onChange: (services: SiteContent["services"]) => void;
}) {
  function replaceService(index: number, service: ServiceItem) {
    const next = [...services];
    next[index] = service;
    onChange(next);
  }

  function addService() {
    if (services.length >= 30) return;

    const service: ServiceItem = {
      slug: `service-${Date.now()}`,
      title: "New Service",
      eyebrow: "Service",
      icon: "BriefcaseBusiness",
      image: "/logo/logo.png",
      summary: "Add a short service summary.",
      overview: "Add the complete service overview.",
      highlights: ["Add a service highlight"],
      capabilities: ["Add a service capability"],
      workflow: ["Add a workflow step"],
      technologies: [],
      industries: [],
      faq: [],
    };

    onChange([...services, service]);
  }

  function removeService(index: number) {
    if (services.length <= 1) return;

    const service = services[index];

    if (
      typeof window !== "undefined" &&
      service &&
      !window.confirm(`Delete "${service.title}"?`)
    ) {
      return;
    }

    onChange(services.filter((_, current) => current !== index));
  }

  function moveService(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= services.length) return;

    const next = [...services];
    const removed = next.splice(index, 1)[0];

    if (!removed) return;

    next.splice(target, 0, removed);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {services.length} service{services.length === 1 ? "" : "s"} configured
        </p>

        <button
          type="button"
          onClick={addService}
          disabled={services.length >= 30}
          className="rounded-xl bg-[#C1121F] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          + Add Service
        </button>
      </div>

      {services.map((service, index) => (
        <details
          key={index}
          className="rounded-2xl border border-white/10 bg-black/25"
        >
          <summary className="cursor-pointer px-5 py-4">
            <div className="inline-flex flex-col">
              <span className="font-semibold">
                {index + 1}. {service.title}
              </span>

              <span className="mt-1 text-xs text-zinc-500">
                /services/{service.slug}
              </span>
            </div>
          </summary>

          <div className="border-t border-white/10 p-5">
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveService(index, -1)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30"
              >
                Move Up
              </button>

              <button
                type="button"
                disabled={index === services.length - 1}
                onClick={() => moveService(index, 1)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-30"
              >
                Move Down
              </button>

              <button
                type="button"
                disabled={services.length <= 1}
                onClick={() => removeService(index)}
                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 disabled:opacity-30"
              >
                Delete Service
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Title"
                value={service.title}
                onChange={(value) =>
                  replaceService(index, { ...service, title: value })
                }
              />

              <Field
                label="Slug"
                value={service.slug}
                onChange={(value) =>
                  replaceService(index, { ...service, slug: value })
                }
              />

              <Field
                label="Eyebrow"
                value={service.eyebrow}
                onChange={(value) =>
                  replaceService(index, { ...service, eyebrow: value })
                }
              />

              <Field
                label="Icon"
                value={service.icon}
                onChange={(value) =>
                  replaceService(index, { ...service, icon: value })
                }
              />

              <Field
                label="Image"
                value={service.image}
                onChange={(value) =>
                  replaceService(index, { ...service, image: value })
                }
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-amber-300/80">
              Slug controls the public URL. Example: cloud-security becomes
              /services/cloud-security. Avoid changing an existing slug unless
              you intentionally want the URL to change.
            </p>

            <TextField
              label="Summary"
              value={service.summary}
              rows={3}
              onChange={(value) =>
                replaceService(index, { ...service, summary: value })
              }
            />

            <TextField
              label="Overview"
              value={service.overview}
              rows={6}
              onChange={(value) =>
                replaceService(index, { ...service, overview: value })
              }
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <StringListEditor
                label="Highlights"
                items={service.highlights}
                onChange={(highlights) =>
                  replaceService(index, { ...service, highlights })
                }
              />

              <StringListEditor
                label="Capabilities"
                items={service.capabilities}
                onChange={(capabilities) =>
                  replaceService(index, { ...service, capabilities })
                }
              />

              <StringListEditor
                label="Workflow"
                items={service.workflow}
                onChange={(workflow) =>
                  replaceService(index, { ...service, workflow })
                }
              />

              <StringListEditor
                label="Technologies"
                items={service.technologies}
                onChange={(technologies) =>
                  replaceService(index, { ...service, technologies })
                }
              />

              <StringListEditor
                label="Industries"
                items={service.industries}
                onChange={(industries) =>
                  replaceService(index, { ...service, industries })
                }
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">FAQ</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Questions displayed on this service detail page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    replaceService(index, {
                      ...service,
                      faq: [
                        ...service.faq,
                        {
                          question: "New question",
                          answer: "Add the answer here.",
                        },
                      ],
                    })
                  }
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs"
                >
                  + Add FAQ
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {service.faq.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    No FAQ items configured.
                  </p>
                )}

                {service.faq.map((faq, faqIndex) => (
                  <div
                    key={faqIndex}
                    className="rounded-xl border border-white/10 bg-black/30 p-4"
                  >
                    <Field
                      label={`Question ${faqIndex + 1}`}
                      value={faq.question}
                      onChange={(value) => {
                        const faqItems = service.faq.map((item, current) =>
                          current === faqIndex
                            ? { ...item, question: value }
                            : item
                        );

                        replaceService(index, {
                          ...service,
                          faq: faqItems,
                        });
                      }}
                    />

                    <TextField
                      label="Answer"
                      value={faq.answer}
                      rows={4}
                      onChange={(value) => {
                        const faqItems = service.faq.map((item, current) =>
                          current === faqIndex
                            ? { ...item, answer: value }
                            : item
                        );

                        replaceService(index, {
                          ...service,
                          faq: faqItems,
                        });
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        replaceService(index, {
                          ...service,
                          faq: service.faq.filter(
                            (_, current) => current !== faqIndex
                          ),
                        })
                      }
                      className="mt-3 rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300"
                    >
                      Remove FAQ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-zinc-300">
      {label}
      <textarea
        rows={6}
        value={items.join("\n")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
          )
        }
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 outline-none focus:border-[#C1121F]"
      />
      <span className="mt-1 block text-xs font-normal text-zinc-600">
        One item per line.
      </span>
    </label>
  );
}

function ModuleEditor({ label, value, onApply }: { label: string; value: unknown; onApply: (value: unknown) => void }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState("");

  function toggleOpen() {
    if (!open) {
      setRaw(JSON.stringify(value, null, 2));
      setError("");
    }

    setOpen(!open);
  }

  function apply() {
    try {
      onApply(JSON.parse(raw));
      setError("");
    } catch {
      setError("Invalid JSON syntax in this module.");
    }
  }
  return <div className="rounded-xl border border-white/10 bg-black/25"><button onClick={toggleOpen} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"><span>{label}</span><span className="text-zinc-500">{open ? "Close" : "Edit"}</span></button>{open && <div className="border-t border-white/10 p-4"><textarea value={raw} onChange={(event) => setRaw(event.target.value)} spellCheck={false} className="min-h-64 w-full rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-6 outline-none focus:border-[#C1121F]" />{error && <p className="mt-2 text-sm text-red-300">{error}</p>}<button onClick={apply} className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5">Apply module locally</button></div>}</div>;
}
