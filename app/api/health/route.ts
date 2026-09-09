import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/storage";
export const runtime="nodejs";
export async function GET(){try{const content=await getSiteContent();return NextResponse.json({status:"ok",service:"team-drsa-website",company:content.company.name,timestamp:new Date().toISOString()});}catch{return NextResponse.json({status:"degraded",service:"team-drsa-website",timestamp:new Date().toISOString()},{status:503});}}
