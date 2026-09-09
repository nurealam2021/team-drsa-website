import { NextResponse } from "next/server";
import { getCurrentAdminUserWithPermission } from "@/lib/auth";
import { listAuditRecords } from "@/lib/storage";

export async function GET() {
  const user = await getCurrentAdminUserWithPermission("audit.read");
  if (!user) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, records: await listAuditRecords(300) });
}
