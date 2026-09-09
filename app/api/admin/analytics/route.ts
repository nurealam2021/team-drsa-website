import { NextResponse } from "next/server";
import { getCurrentAdminUserWithPermission } from "@/lib/auth";
import { getAnalytics } from "@/lib/storage";

export async function GET() {
  const user = await getCurrentAdminUserWithPermission("analytics.read");
  if (!user) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, analytics: await getAnalytics() });
}
