import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPageView } from "@/lib/storage";

export const runtime = "nodejs";
const schema = z.object({ path: z.string().startsWith("/").max(240) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.path.startsWith("/admin") || parsed.data.path.startsWith("/api")) {
    return new NextResponse(null, { status: 204 });
  }
  await recordPageView(parsed.data.path);
  return new NextResponse(null, { status: 204 });
}
