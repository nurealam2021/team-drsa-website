import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import DetailShell from "@/components/DetailShell";
import { SiteIcon } from "@/lib/icons";
import { getSiteContent } from "@/lib/storage";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=await getSiteContent();const x=c.caseStudies.find(i=>i.slug===slug&&i.status==="published");if(!x)notFound();return <DetailShell eyebrow="Case study" title={x.title} description={x.summary} backHref="/#case-studies" backLabel="Back to case studies"><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"><SiteIcon name={x.icon} className="mb-6 h-9 w-9 text-[#C1121F]"/><h2 className="text-2xl font-semibold">Context and solution</h2><p className="mt-4 leading-8 text-zinc-300">{x.summary}</p></div><div className="rounded-[2rem] border border-[#C1121F]/30 bg-[#C1121F]/10 p-7"><h2 className="text-2xl font-semibold">Outcome</h2><p className="mt-4 leading-8 text-red-100">{x.outcome}</p><Link href="/#consultation" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-bold">Discuss a similar project <ArrowRight className="h-4 w-4"/></Link></div></div></DetailShell>}
