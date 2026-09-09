import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Layers3, ShieldCheck } from "lucide-react";
import DetailShell from "@/components/DetailShell";
import { SiteIcon } from "@/lib/icons";
import { getSiteContent } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getSiteContent();
  const service = content.services.find((x) => x.slug === slug);
  return service ? { title: `${service.title} | Team DRSA`, description: service.summary } : { title: "Service Not Found | Team DRSA" };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getSiteContent();
  const service = content.services.find((x) => x.slug === slug);
  if (!service) notFound();
  return <DetailShell eyebrow={service.eyebrow} title={service.title} description={service.summary} backHref="/#services" backLabel="Back to services">
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"><SiteIcon name={service.icon} className="mb-6 h-9 w-9 text-[#C1121F]" /><h2 className="text-2xl font-semibold">Service overview</h2><p className="mt-4 leading-8 text-zinc-300">{service.overview}</p><Link href="/#consultation" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-bold">Request consultation <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-4 sm:grid-cols-2">{service.highlights.map((x) => <div key={x} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><CheckCircle2 className="mb-4 h-5 w-5 text-[#C1121F]" /><p className="font-semibold">{x}</p></div>)}</div></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-3"><List title="Capabilities" items={service.capabilities} /><List title="Technologies" items={service.technologies} /><List title="Workflow" items={service.workflow} /></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"><ShieldCheck className="mb-5 h-7 w-7 text-[#C1121F]" /><h2 className="text-2xl font-semibold">Security approach</h2><p className="mt-4 leading-8 text-zinc-300">Secure design, least privilege, validation, documentation, monitoring readiness, and risk-aware implementation are built into delivery.</p></div><div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"><Layers3 className="mb-5 h-7 w-7 text-[#C1121F]" /><h2 className="text-2xl font-semibold">Industries supported</h2><div className="mt-5 flex flex-wrap gap-3">{service.industries.map((x) => <span key={x} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">{x}</span>)}</div></div></div>
    <div className="mt-8 grid gap-4 lg:grid-cols-2">{service.faq.map((x) => <div key={x.question} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><h3 className="font-semibold">{x.question}</h3><p className="mt-3 leading-7 text-zinc-400">{x.answer}</p></div>)}</div>
  </DetailShell>;
}

function List({ title, items }: { title: string; items: string[] }) { return <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7"><h2 className="text-2xl font-semibold">{title}</h2><div className="mt-6 space-y-3">{items.map((x) => <div key={x} className="flex gap-3 rounded-2xl bg-black/25 p-4 text-sm text-zinc-300"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#C1121F]" />{x}</div>)}</div></div>; }
