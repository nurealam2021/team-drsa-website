import { NextResponse } from "next/server";
import { defaultSiteContent } from "@/lib/content";
import { getCurrentAdminUserWithPermission, writeAudit } from "@/lib/auth";
import { siteContentSchema } from "@/lib/schemas";
import { requestBodyTooLarge, sameOriginRequest } from "@/lib/request-guards";
import { getSiteContent, saveSiteContent } from "@/lib/storage";

export async function GET() {
  const user = await getCurrentAdminUserWithPermission("content.read");
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, content: await getSiteContent(), defaults: defaultSiteContent });
}

export async function PUT(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ ok: false, message: "Cross-origin request rejected." }, { status: 403 });
  if (requestBodyTooLarge(request, 1_048_576)) return NextResponse.json({ ok: false, message: "Content payload is too large." }, { status: 413 });
  const user = await getCurrentAdminUserWithPermission("content.write");
  if (!user) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = siteContentSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ ok: false, message: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid site content structure." }, { status: 400 });
  }

  await saveSiteContent(parsed.data);
  await writeAudit(user, "content.update", "site-content", {
    services: parsed.data.services.length,
    projects: parsed.data.projects.length,
    insights: parsed.data.insights.length,
  });
  return NextResponse.json({ ok: true, content: parsed.data });
}
