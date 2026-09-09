import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminUser,
  getCurrentAdminUserWithPermission,
  listAdminUserViews,
  revokeAdminUserSessions,
  updateAdminUser,
  writeAudit,
} from "@/lib/auth";
import { sameOriginRequest } from "@/lib/request-guards";

const role = z.enum(["super_admin", "content_manager", "business_manager", "analyst", "viewer"]);
const createSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(2).max(120),
  role,
  password: z.string().min(12).max(200),
});
const patchSchema = z.object({
  id: z.string().uuid(),
  role: role.optional(),
  active: z.boolean().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  password: z.string().min(12).max(200).optional(),
});

export async function GET() {
  const user = await getCurrentAdminUserWithPermission("users.manage");
  if (!user) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, users: await listAdminUserViews() });
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await getCurrentAdminUserWithPermission("users.manage");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "Invalid user." }, { status: 400 });
  try {
    const created = await createAdminUser(parsed.data);
    await writeAudit(actor, "admin-user.create", created.id, { email: created.email, role: created.role });
    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Could not create user." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await getCurrentAdminUserWithPermission("users.manage");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "Invalid update." }, { status: 400 });
  if (parsed.data.id === actor.id && parsed.data.active === false) {
    return NextResponse.json({ ok: false, message: "You cannot deactivate your own account." }, { status: 400 });
  }
  try {
    const updated = await updateAdminUser(parsed.data);
    await revokeAdminUserSessions(updated.id);
    await writeAudit(actor, "admin-user.update", updated.id, { role: updated.role, active: updated.active });
    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Could not update user." }, { status: 400 });
  }
}
