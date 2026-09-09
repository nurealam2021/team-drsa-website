import Link from "next/link";
import { notFound } from "next/navigation";
import DetailShell from "@/components/DetailShell";
import { getSiteContent } from "@/lib/storage";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=await getSiteContent();const x=c.careers.find(i=>i.slug===slug&&i.status==="open");if(!x)notFound();return <DetailShell eyebrow={`${x.location} • ${x.type}`} title={x.title} description={x.summary} backHref="/#careers" backLabel="Back to careers"><div className="max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"><h2 className="text-2xl font-semibold">Role overview</h2><p className="mt-4 leading-8 text-zinc-300">{x.summary}</p><Link href="/#consultation" className="mt-7 inline-flex rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-bold">Contact Team DRSA about this role</Link></div></DetailShell>}
