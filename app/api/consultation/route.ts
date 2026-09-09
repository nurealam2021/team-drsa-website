import { NextRequest, NextResponse } from "next/server";
import { createInquiry } from "@/lib/storage";
import { consultationSchema } from "@/lib/schemas";
import { requestBodyTooLarge } from "@/lib/request-guards";

export const runtime = "nodejs";



const rate = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string) {
  const now = Date.now();
  const current = rate.get(key);
  if (!current || current.resetAt < now) {
    rate.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

export async function POST(request: NextRequest) {
  if (requestBodyTooLarge(request, 16_384)) return NextResponse.json({ ok: false, message: "Request body is too large." }, { status: 413 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, message: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = consultationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Please check the form fields and try again." }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true, message: "Request received." });
  }

  const inquiry = await createInquiry({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    organization: parsed.data.organization,
    phone: parsed.data.phone,
    service: parsed.data.service,
    details: parsed.data.details,
    source: request.headers.get("referer") || "website",
  });

  const webhook = process.env.INQUIRY_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "team_drsa.inquiry.created", inquiry }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Persistence succeeded; webhook failure must not lose the lead.
    }
  }

  return NextResponse.json({ ok: true, message: "Thank you. Team DRSA received your request and will review it." }, { status: 201 });
}
