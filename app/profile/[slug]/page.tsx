import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, ExternalLink } from "lucide-react";
import DetailShell from "@/components/DetailShell";
import { SiteIcon } from "@/lib/icons";
import { getSiteContent } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const content = await getSiteContent();
  const person = [...content.leadership, ...content.foundingTeam].find((x) => x.slug === slug);
  return person ? { title: `${person.name} | Team DRSA`, description: person.summary } : { title: "Profile Not Found | Team DRSA" };
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const content = await getSiteContent();
  const person = [...content.leadership, ...content.foundingTeam].find((x) => x.slug === slug);
  if (!person) notFound();
  return <DetailShell eyebrow={person.type} title={person.name} description={person.role} backHref="/#profile" backLabel="Back to company profile"><div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]"><aside className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]"><div className="relative aspect-[4/5] bg-gradient-to-br from-zinc-900 via-zinc-800 to-[#C1121F]"><Image src={person.image} alt={person.name} fill sizes="(max-width: 1024px) 100vw, 34vw" className="object-cover opacity-90" /></div><div className="p-6"><div className="inline-flex items-center gap-2 rounded-full bg-[#C1121F]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-100"><SiteIcon name={person.icon} className="h-4 w-4 text-[#C1121F]" />{person.type}</div>{person.linkedin && <a href={person.linkedin} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold">Professional profile <ExternalLink className="h-4 w-4" /></a>}</div></aside><section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 lg:p-10"><p className="text-lg leading-8 text-zinc-300">{person.summary}</p><div className="mt-8 grid gap-6 lg:grid-cols-2"><List icon={<BadgeCheck className="h-5 w-5 text-[#C1121F]" />} title="Professional focus" items={person.professionalFocus} /><List icon={<BriefcaseBusiness className="h-5 w-5 text-[#C1121F]" />} title="Responsibilities" items={person.responsibilities} /></div><div className="mt-6 rounded-3xl border border-[#C1121F]/30 bg-[#C1121F]/10 p-6"><h3 className="text-xl font-semibold">Expertise</h3><p className="mt-3 leading-8 text-red-100">{person.expertise}</p></div></section></div></DetailShell>;
}
function List({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) { return <div className="rounded-3xl border border-white/10 bg-black/30 p-6"><h3 className="mb-5 flex items-center gap-2 text-xl font-semibold">{icon}{title}</h3><div className="space-y-3">{items.map((x) => <p key={x} className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">{x}</p>)}</div></div>; }
