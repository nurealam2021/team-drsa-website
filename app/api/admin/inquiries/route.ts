import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdminUserWithPermission, writeAudit } from "@/lib/auth";
import { sameOriginRequest } from "@/lib/request-guards";
import { listInquiries, updateInquiryStatus } from "@/lib/storage";

export async function GET() {
  const user = await getCurrentAdminUserWithPermission("inquiries.read");
  if (!user) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, inquiries: await listInquiries() });
}

export async function PATCH(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const user = await getCurrentAdminUserWithPermission("inquiries.write");
  if (!user) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["new", "reviewing", "contacted", "qualified", "closed"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Invalid status update." }, { status: 400 });
  const updated = await updateInquiryStatus(parsed.data.id, parsed.data.status);
  if (!updated) return NextResponse.json({ ok: false, message: "Inquiry not found." }, { status: 404 });
  await writeAudit(user, "inquiry.status", updated.id, { status: updated.status });
  return NextResponse.json({ ok: true, inquiry: updated });
}
