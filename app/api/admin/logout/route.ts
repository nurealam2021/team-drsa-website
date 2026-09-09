import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getCurrentAdminUser, revokeAdminSession, writeAudit } from "@/lib/auth";
import { sameOriginRequest } from "@/lib/request-guards";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const user = await getCurrentAdminUser();
  if (user) await writeAudit(user, "admin.logout", "admin-session");
  await revokeAdminSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
