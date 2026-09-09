"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  Code2,
  ExternalLink,
  FileText,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { SiteContent } from "@/lib/content";
import { SiteIcon } from "@/lib/icons";

type Props = { content: SiteContent };

type SearchItem = { title: string; type: string; description: string; href: string };

function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost"; className?: string }) {
  const style = variant === "primary"
    ? "bg-[#C1121F] text-white shadow-[0_18px_50px_rgba(193,18,31,0.30)] hover:-translate-y-0.5 hover:bg-red-700"
    : "border border-white/15 bg-white/5 text-white backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/10";
  return <a href={href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#C1121F] ${style} ${className}`}>{children}</a>;
}

function Section({ id, eyebrow, title, subtitle, children, light = false }: { id?: string; eyebrow: string; title: string; subtitle?: string; children: React.ReactNode; light?: boolean }) {
  return <section id={id} className={`scroll-mt-28 px-5 py-20 sm:px-8 lg:px-12 ${light ? "bg-white text-black" : "bg-[#0A0A0A] text-white"}`}>
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 max-w-3xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.32em] text-[#C1121F]">{eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
        {subtitle && <p className={`mt-5 text-base leading-7 ${light ? "text-zinc-600" : "text-zinc-400"}`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  </section>;
}

function Logo({ content, compact = false }: { content: SiteContent; compact?: boolean }) {
  return <a href="#home" aria-label={`${content.company.name} home`} className="flex items-center">
    <Image src={content.company.logoPath} alt={`${content.company.name} logo`} width={320} height={160} priority={compact} className={compact ? "h-14 w-auto object-contain" : "h-20 w-auto object-contain sm:h-24"} />
  </a>;
}

function AnimatedGlobe({ content }: Props) {
  return <div className="rc-globe-stage mx-auto lg:mx-0">
    <div className="rc-globe-glow" /><div className="rc-orbit-ring" />
    <div className="rc-globe-earth"><div className="absolute inset-[12%] rounded-full border border-white/10" /><div className="absolute inset-[24%] rounded-full border border-white/10" /></div>
    <div className="rc-orbit-layer">
      {content.services.map((service, index) => {
        const angle = (360 / content.services.length) * index;
        return <div key={service.slug} className="rc-orbit-node" style={{ "--angle": `${angle}deg` } as React.CSSProperties}>
          <a href={`/services/${service.slug}`} className="rc-orbit-card" title={service.title}><span className="rc-orbit-icon"><SiteIcon name={service.icon} className="h-4 w-4" /></span><span>{service.title}</span></a>
        </div>;
      })}
    </div>
    <a href="#services" className="rc-globe-core" aria-label={`Explore ${content.company.name} services`}><Image src={content.company.logoPath} alt={`${content.company.name} logo`} width={240} height={120} className="h-[92px] w-auto object-contain" /></a>
  </div>;
}

function Navbar({ content }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const searchItems = useMemo<SearchItem[]>(() => [
    ...content.services.map((x) => ({ title: x.title, type: "Service", description: x.summary, href: `/services/${x.slug}` })),
    ...content.industries.map((x) => ({ title: x.title, type: "Industry", description: x.description, href: "/#industries" })),
    ...content.projects.filter((x) => x.status === "published").map((x) => ({ title: x.title, type: "Project", description: x.description, href: `/projects/${x.slug}` })),
    ...content.caseStudies.filter((x) => x.status === "published").map((x) => ({ title: x.title, type: "Case Study", description: x.summary, href: `/case-studies/${x.slug}` })),
    ...content.insights.filter((x) => x.status === "published").map((x) => ({ title: x.title, type: "Insight", description: x.summary, href: `/insights/${x.slug}` })),
    ...[...content.leadership, ...content.foundingTeam].map((x) => ({ title: x.name, type: x.type, description: x.role, href: `/profile/${x.slug}` })),
    ...content.careers.filter((x) => x.status === "open").map((x) => ({ title: x.title, type: "Career", description: x.summary, href: `/careers/${x.slug}` })),
  ], [content]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchItems.slice(0, 8);
    return searchItems.filter((item) => `${item.title} ${item.type} ${item.description}`.toLowerCase().includes(q)).slice(0, 12);
  }, [query, searchItems]);

  const close = () => { setServicesOpen(false); setMoreOpen(false); };
  const menuClass = "whitespace-nowrap rounded-xl px-2.5 py-2 text-[13px] font-semibold text-zinc-200 transition hover:bg-white/5 hover:text-white xl:px-3 xl:text-sm";

  return <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/92 backdrop-blur-2xl">
    <nav className="mx-auto flex h-24 w-full max-w-[1800px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
      <Logo content={content} compact />
      <div className="hidden items-center justify-center gap-1 lg:flex xl:gap-2">
        <a href="#home" className={menuClass}>Home</a>
        <div className="relative">
          <button type="button" onClick={() => { setServicesOpen((v) => !v); setMoreOpen(false); }} className={`${menuClass} flex items-center gap-1`}>Services <ChevronDown className={`h-4 w-4 ${servicesOpen ? "rotate-180" : ""}`} /></button>
          {servicesOpen && <div className="absolute left-0 top-full mt-3 w-[650px] rounded-3xl border border-white/10 bg-[#111]/98 p-4 shadow-2xl">
            <div className="grid gap-3 sm:grid-cols-2">{content.services.map((service) => { return <a key={service.slug} href={`/services/${service.slug}`} onClick={close} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#C1121F]/60 hover:bg-[#C1121F]/10"><SiteIcon name={service.icon} className="mb-3 h-5 w-5 text-[#C1121F]" /><p className="font-semibold">{service.title}</p><p className="mt-2 text-sm leading-6 text-zinc-400">{service.summary}</p></a>; })}</div>
          </div>}
        </div>
        {["industries", "case-studies", "insights", "careers", "support"].map((id) => <a key={id} href={`/#${id}`} className={menuClass}>{id.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join(" ")}</a>)}
        <div className="relative"><button type="button" onClick={() => { setMoreOpen((v) => !v); setServicesOpen(false); }} className={`${menuClass} flex items-center gap-1`}>More <ChevronDown className="h-4 w-4" /></button>{moreOpen && <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-white/10 bg-[#111]/98 p-3 shadow-2xl">{[["About", "/#about"], ["Company Profile", "/#profile"], ["Projects", "/#projects"], ["Consultation", "/#consultation"], ["Admin", "/admin"]].map(([label, href]) => <a key={label} href={href} onClick={close} className="block rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white">{label}</a>)}</div>}</div>
      </div>
      <div className="hidden items-center gap-3 lg:flex"><button onClick={() => setSearchOpen(true)} aria-label="Search website" className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"><Search className="h-5 w-5" /></button><ButtonLink href="#consultation">Request Consultation <ArrowRight className="h-4 w-4" /></ButtonLink></div>
      <button onClick={() => setMobileOpen((v) => !v)} className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 lg:hidden" aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</button>
    </nav>
    {mobileOpen && <div className="border-t border-white/10 px-5 py-4 lg:hidden">{[["Home", "/#home"], ["Services", "/#services"], ["Industries", "/#industries"], ["Case Studies", "/#case-studies"], ["Insights", "/#insights"], ["Careers", "/#careers"], ["Support", "/#support"], ["About", "/#about"], ["Projects", "/#projects"]].map(([label, href]) => <a key={label} href={href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/5">{label}</a>)}<button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/5"><Search className="h-4 w-4" /> Search</button><ButtonLink href="#consultation" className="mt-3 w-full">Request Consultation</ButtonLink></div>}
    {searchOpen && <div className="fixed inset-0 z-[70] bg-black/75 px-5 pt-24 backdrop-blur-sm" onMouseDown={(e) => { if (e.currentTarget === e.target) setSearchOpen(false); }}><div className="mx-auto max-h-[75vh] w-full max-w-3xl overflow-auto rounded-3xl border border-white/10 bg-[#111] p-5 shadow-2xl"><div className="flex items-center gap-3"><Search className="h-5 w-5 text-[#C1121F]" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services, people, projects, insights..." className="w-full bg-transparent py-3 text-white outline-none placeholder:text-zinc-500" /><button onClick={() => setSearchOpen(false)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">Close</button></div><div className="mt-4 space-y-2">{results.length ? results.map((item) => <a key={`${item.type}-${item.title}`} href={item.href} onClick={() => setSearchOpen(false)} className="block rounded-2xl border border-white/10 p-4 hover:border-[#C1121F]/60 hover:bg-white/[0.03]"><div className="flex items-center justify-between gap-4"><p className="font-semibold">{item.title}</p><span className="rounded-full bg-[#C1121F]/15 px-3 py-1 text-xs font-bold text-red-200">{item.type}</span></div><p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p></a>) : <p className="py-10 text-center text-zinc-400">No matching content found.</p>}</div></div></div>}
  </header>;
}

function TypewriterHeadline({ text }: { text: string }) {
  const phrases = useMemo(() => {
    const parsed =
      text
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
        ?.map((phrase) => phrase.trim())
        .filter(Boolean) ?? [];

    return parsed.length > 0 ? parsed : [text.trim()];
  }, [text]);

  const [display, setDisplay] = useState("");

  const phraseIndexRef = useRef(0);
  const characterIndexRef = useRef(0);
  const deletingRef = useRef(false);
  const pauseTicksRef = useRef(0);
  const typingTickRef = useRef(0);

  useEffect(() => {
    phraseIndexRef.current = 0;
    characterIndexRef.current = 0;
    deletingRef.current = false;
    pauseTicksRef.current = 4;
    typingTickRef.current = 0;

    const interval = window.setInterval(() => {
      if (phrases.length === 0) return;

      if (pauseTicksRef.current > 0) {
        pauseTicksRef.current -= 1;
        return;
      }

      const phrase =
        phrases[phraseIndexRef.current % phrases.length] ?? "";

      /*
       * Typing is intentionally a little slower than deletion.
       * Interval = 35 ms.
       * Typing updates every second tick ≈ 70 ms.
       */
      if (!deletingRef.current) {
        typingTickRef.current += 1;

        if (typingTickRef.current < 2) {
          return;
        }

        typingTickRef.current = 0;

        if (characterIndexRef.current < phrase.length) {
          characterIndexRef.current += 1;

          setDisplay(
            phrase.slice(0, characterIndexRef.current)
          );

          return;
        }

        /*
         * Phrase completely typed.
         * 34 ticks × 35 ms ≈ 1.2 seconds.
         */
        deletingRef.current = true;
        pauseTicksRef.current = 34;
        return;
      }

      /*
       * Delete one character every interval tick.
       */
      if (characterIndexRef.current > 0) {
        characterIndexRef.current -= 1;

        setDisplay(
          phrase.slice(0, characterIndexRef.current)
        );

        return;
      }

      /*
       * Finished deleting.
       * Advance to next sentence.
       */
      deletingRef.current = false;

      phraseIndexRef.current =
        (phraseIndexRef.current + 1) % phrases.length;

      characterIndexRef.current = 0;
      typingTickRef.current = 0;

      /*
       * Small pause before next sentence.
       */
      pauseTicksRef.current = 7;
    }, 35);

    return () => {
      window.clearInterval(interval);
    };
  }, [phrases]);

  return (
    <h1
      data-typewriter-version="drsa-typewriter-v4"
      aria-label={text}
      className="min-h-[110px] max-w-3xl text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl lg:min-h-[150px] lg:text-5xl"
    >
      <span>{display}</span>

      <span
        aria-hidden="true"
        className="ml-2 inline-block h-[0.85em] w-[4px] rounded-full bg-[#C1121F] animate-pulse"
      />
    </h1>
  );
}

function Hero({ content }: Props) {
  return <section id="home" className="relative overflow-hidden bg-[#0A0A0A] px-5 py-12 text-white sm:px-8 lg:px-12"><div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_30%,rgba(193,18,31,0.28),transparent_34%),radial-gradient(circle_at_90%_15%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(135deg,#0A0A0A,#171717_50%,#070707)]" /><div className="relative mx-auto grid min-h-[calc(100vh-120px)] max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]"><div className="order-2 flex justify-center lg:order-1 lg:justify-start"><AnimatedGlobe content={content} /></div><div className="order-1 lg:order-2"><a href="#services" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300"><LockKeyhole className="h-4 w-4 text-[#C1121F]" /> {content.hero.badge}</a><TypewriterHeadline text={content.company.tagline} /><p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300">{content.hero.description}</p><div className="mt-9 flex flex-col gap-4 sm:flex-row"><ButtonLink href="#consultation">Start a Consultation <ArrowRight className="h-4 w-4" /></ButtonLink><ButtonLink href="#services" variant="ghost">Explore Services</ButtonLink></div><div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">{content.hero.stats.map((x) => <div key={x.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xl font-bold">{x.value}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{x.label}</p></div>)}</div></div></div></section>;
}

function Services({ content }: Props) {
  return <Section id="services" eyebrow="Services" title="Security, infrastructure, and software under one delivery model." subtitle="Each service has a dedicated detail page and a direct path into the consultation workflow."><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{content.services.map((s) => { return <a key={s.slug} href={`/services/${s.slug}`} className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 transition hover:-translate-y-2 hover:border-[#C1121F]/60"><div className="mb-6 grid h-13 w-13 place-items-center rounded-2xl bg-[#C1121F]/15 text-[#C1121F]"><SiteIcon name={s.icon} className="h-6 w-6" /></div><h3 className="text-xl font-semibold">{s.title}</h3><p className="mt-4 text-sm leading-7 text-zinc-400">{s.summary}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold group-hover:text-[#C1121F]">Open details <ArrowRight className="h-4 w-4" /></span></a>; })}</div></Section>;
}

function AboutAndTeam({ content }: Props) {
  return <>
    <Section id="about" light eyebrow="About" title={content.about.title} subtitle={content.about.subtitle}><div className="grid gap-6 lg:grid-cols-3">{content.about.values.map((x) => { return <div key={x.title} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-7"><SiteIcon name={x.icon} className="mb-5 h-8 w-8 text-[#C1121F]" /><h3 className="text-xl font-semibold">{x.title}</h3><p className="mt-3 leading-7 text-zinc-600">{x.description}</p></div>; })}</div></Section>
    <Section id="introduction" eyebrow="How we deliver" title="From discovery to secure production delivery." subtitle="A simple, accountable engagement model for security, infrastructure, networking, consultancy, and software projects."><div className="grid gap-4 md:grid-cols-4">{content.about.deliverySteps.map((x, i) => <div key={x} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#C1121F] text-sm font-bold">{i + 1}</span><p className="mt-5 font-semibold">{x}</p></div>)}</div></Section>
    <Section id="profile" light eyebrow="Company profile" title="Founder and Co-Founders." subtitle="Meet the core leadership behind Team DRSA."><div className="mx-auto grid max-w-6xl gap-7 sm:grid-cols-2 xl:grid-cols-4">{content.leadership.map((person) => { return <a key={person.slug} href={`/profile/${person.slug}`} className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[4/4.6] bg-gradient-to-br from-zinc-900 via-zinc-800 to-[#C1121F]"><Image src={person.image} alt={person.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-cover opacity-90 transition group-hover:scale-105" /></div><div className="p-5"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#C1121F]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#C1121F]"><SiteIcon name={person.icon} className="h-3.5 w-3.5" />{person.type}</div><h3 className="text-lg font-semibold">{person.name}</h3><p className="mt-1 text-sm font-bold text-[#C1121F]">{person.role}</p><p className="mt-3 text-xs leading-5 text-zinc-600">{person.summary}</p></div></a>; })}</div></Section>
  </>;
}

function PortfolioAndContent({ content }: Props) {
  return <>
    <Section id="projects" eyebrow="Projects" title="Selected work and solution patterns." subtitle="Published projects now have dedicated project routes instead of dead links."><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{content.projects.filter((x) => x.status === "published").map((x) => <a key={x.slug} href={`/projects/${x.slug}`} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-[#C1121F]/60"><div className="relative aspect-video overflow-hidden bg-zinc-900"><Image src={x.image} alt={x.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover opacity-80 transition group-hover:scale-105" /></div><div className="p-6"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#C1121F]">{x.sector}</p><h3 className="mt-3 text-xl font-semibold">{x.title}</h3><p className="mt-3 text-sm leading-7 text-zinc-400">{x.description}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold">Open project <ExternalLink className="h-4 w-4" /></span></div></a>)}</div></Section>
    <Section id="industries" light eyebrow="Industries" title="Solutions adaptable to serious organizations." subtitle="Technology and controls are tailored to operational context, risk, and business requirements."><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{content.industries.map((x) => { return <a key={x.title} href="#consultation" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><SiteIcon name={x.icon} className="mb-5 h-8 w-8 text-[#C1121F]" /><h3 className="text-xl font-semibold">{x.title}</h3><p className="mt-3 leading-7 text-zinc-600">{x.description}</p></a>; })}</div></Section>
    <Section id="case-studies" eyebrow="Case studies" title="Outcomes presented with context and accountability." subtitle="Each published case study has a dedicated page."><div className="grid gap-5 lg:grid-cols-3">{content.caseStudies.filter((x) => x.status === "published").map((x) => { return <a href={`/case-studies/${x.slug}`} key={x.slug} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#C1121F]/60"><SiteIcon name={x.icon} className="mb-5 h-8 w-8 text-[#C1121F]" /><h3 className="text-xl font-semibold">{x.title}</h3><p className="mt-3 leading-7 text-zinc-400">{x.summary}</p><p className="mt-4 text-sm font-semibold text-red-200">{x.outcome}</p><span className="mt-6 inline-flex items-center gap-2 font-bold">Read case study <ArrowRight className="h-4 w-4" /></span></a>; })}</div></Section>
    <Section id="insights" light eyebrow="Insights" title="Security and technology leadership content." subtitle="Published insight entries are searchable and have their own routes."><div className="grid gap-5 lg:grid-cols-3">{content.insights.filter((x) => x.status === "published").map((x) => <a href={`/insights/${x.slug}`} key={x.slug} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 transition hover:-translate-y-1 hover:shadow-xl"><FileText className="mb-5 h-7 w-7 text-[#C1121F]" /><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C1121F]">{x.category}</p><h3 className="mt-3 text-xl font-semibold">{x.title}</h3><p className="mt-3 leading-7 text-zinc-600">{x.summary}</p></a>)}</div></Section>
  </>;
}

function Consultation({ content }: Props) {
  const [state, setState] = useState<{ status: "idle" | "sending" | "success" | "error"; message: string }>({ status: "idle", message: "" });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState({ status: "sending", message: "Submitting your request..." });
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/consultation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Could not submit the request.");
      setState({ status: "success", message: body.message }); form.reset();
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Could not submit the request." });
    }
  }
  const hasEmail = Boolean(content.company.email.trim());
  const hasPhone = Boolean(content.company.phone.trim());
  return <>
    <Section id="careers" eyebrow="Careers" title="Build secure technology with Team DRSA." subtitle={content.careers.some((x) => x.status === "open") ? "Current openings are listed below." : "There are no published openings right now, but future roles will appear here."}>{content.careers.some((x) => x.status === "open") ? <div className="grid gap-4 md:grid-cols-2">{content.careers.filter((x) => x.status === "open").map((x) => <a key={x.slug} href={`/careers/${x.slug}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#C1121F]/60"><Users className="mb-4 h-7 w-7 text-[#C1121F]" /><h3 className="text-xl font-semibold">{x.title}</h3><p className="mt-2 text-sm text-zinc-400">{x.location} • {x.type}</p><p className="mt-4 leading-7 text-zinc-300">{x.summary}</p></a>)}</div> : <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"><Users className="mb-5 h-8 w-8 text-[#C1121F]" /><p className="max-w-3xl leading-8 text-zinc-300">Team DRSA values security-minded engineers, consultants, software developers, cloud specialists, and network professionals. Open roles can be published from the admin content studio.</p></div>}</Section>
    <Section id="support" light eyebrow="Support center" title="Structured support for long-term success." subtitle="Support options connect to real contact and consultation channels."><div className="grid gap-5 md:grid-cols-3">{content.support.map((x) => { return <a href={x.href} key={x.title} className="rounded-3xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"><SiteIcon name={x.icon} className="mb-5 h-7 w-7 text-[#C1121F]" /><h3 className="text-xl font-semibold">{x.title}</h3><p className="mt-3 leading-7 text-zinc-600">{x.description}</p></a>; })}</div></Section>
    <Section id="consultation" eyebrow="Request consultation" title="Tell us what you want to build, secure, or modernize." subtitle="Your request is validated and stored securely for review by the Team DRSA business team."><div id="contact" className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7"><h3 className="text-2xl font-semibold">Contact channels</h3><div className="mt-8 space-y-5 text-zinc-300">{hasEmail ? <a href={`mailto:${content.company.email}`} className="flex items-center gap-3 hover:text-white"><Mail className="h-5 w-5 text-[#C1121F]" />{content.company.email}</a> : <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#C1121F]" />Email can be configured from site settings.</div>}{hasPhone ? <a href={`tel:${content.company.phone.replace(/\s+/g, "")}`} className="flex items-center gap-3 hover:text-white"><Phone className="h-5 w-5 text-[#C1121F]" />{content.company.phone}</a> : <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-[#C1121F]" />Phone can be configured from site settings.</div>}<div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#C1121F]" />{content.company.address}</div><div className="flex items-center gap-3"><CalendarClock className="h-5 w-5 text-[#C1121F]" />Consultation requests are tracked by the admin workflow.</div></div></div><form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white p-6 text-black shadow-xl"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-zinc-700">Full name<input required minLength={2} name="fullName" autoComplete="name" className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#C1121F]" /></label><label className="text-sm font-semibold text-zinc-700">Work email<input required type="email" name="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#C1121F]" /></label><label className="text-sm font-semibold text-zinc-700">Organization<input name="organization" autoComplete="organization" className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#C1121F]" /></label><label className="text-sm font-semibold text-zinc-700">Phone<input name="phone" autoComplete="tel" className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#C1121F]" /></label></div><label className="sr-only" aria-hidden>Website<input name="website" tabIndex={-1} autoComplete="off" /></label><label className="mt-4 block text-sm font-semibold text-zinc-700">Service interest<select name="service" required className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#C1121F]">{content.services.map((s) => <option key={s.slug} value={s.title}>{s.title}</option>)}</select></label><label className="mt-4 block text-sm font-semibold text-zinc-700">Project details<textarea required minLength={20} maxLength={5000} name="details" className="mt-2 min-h-32 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-[#C1121F]" placeholder="Goals, timeline, systems, scope, and security requirements." /></label>{state.message && <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${state.status === "success" ? "bg-green-50 text-green-800" : state.status === "error" ? "bg-red-50 text-red-800" : "bg-zinc-50 text-zinc-700"}`}>{state.message}</p>}<button disabled={state.status === "sending"} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C1121F] px-5 py-4 font-bold text-white transition hover:bg-red-700 disabled:opacity-60">{state.status === "sending" ? "Submitting..." : "Submit request"}<ArrowRight className="h-4 w-4" /></button></form></div></Section>
  </>;
}

function Footer({ content }: Props) {
  return <footer className="border-t border-white/10 bg-black px-5 py-14 text-white sm:px-8 lg:px-12"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.3fr_.7fr_.7fr_.7fr]"><div><Logo content={content} /><p className="mt-5 max-w-md text-sm leading-7 text-zinc-500">{content.company.description}</p><div className="mt-5 flex gap-3"><a href={content.company.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-xl border border-white/10 p-3 hover:bg-white/5"><ExternalLink className="h-4 w-4" /></a><a href="#projects" aria-label="Projects" className="rounded-xl border border-white/10 p-3 hover:bg-white/5"><Code2 className="h-4 w-4" /></a></div></div><div><h4 className="mb-4 font-semibold">Company</h4>{[["About", "/#about"], ["Profile", "/#profile"], ["Careers", "/#careers"], ["Contact", "/#contact"]].map(([x, href]) => <a key={x} className="mb-3 block text-sm text-zinc-500 hover:text-white" href={href}>{x}</a>)}</div><div><h4 className="mb-4 font-semibold">Services</h4>{content.services.slice(0, 5).map((x) => <a key={x.slug} className="mb-3 block text-sm text-zinc-500 hover:text-white" href={`/services/${x.slug}`}>{x.title}</a>)}</div><div><h4 className="mb-4 font-semibold">Trust</h4>{[["Privacy", "/privacy"], ["Terms", "/terms"], ["Security", "/security"], ["Admin", "/admin"]].map(([x, href]) => <a key={x} className="mb-3 block text-sm text-zinc-500 hover:text-white" href={href}>{x}</a>)}</div></div><div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-6 text-sm text-zinc-600 sm:flex-row"><p>© {new Date().getFullYear()} {content.company.name}. All rights reserved.</p><p>Security-first technology delivery.</p></div></footer>;
}

export default function EnterpriseWebsite({ content }: Props) {
  return <main id="main-content" className="min-h-screen overflow-x-hidden bg-[#0A0A0A] text-white antialiased"><Navbar content={content} /><Hero content={content} /><Services content={content} /><AboutAndTeam content={content} /><PortfolioAndContent content={content} /><Consultation content={content} /><Footer content={content} /></main>;
}
