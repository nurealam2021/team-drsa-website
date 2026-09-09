import { z } from "zod";

const shortText = z.string().trim().min(1).max(200);
const mediumText = z.string().trim().min(1).max(1000);
const longText = z.string().trim().min(1).max(10000);
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase kebab-case slugs.").max(120);
const publicAssetPath = z.string().trim().regex(/^\/(?!\/)[A-Za-z0-9_./%() -]+$/, "Use a local public path beginning with /.").max(500);
const icon = z.string().trim().min(1).max(80);
const safeHttpUrl = z.string().trim().url().max(500).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Only http/https URLs are allowed.");
const optionalHttpUrl = z.union([z.literal(""), safeHttpUrl]);
const safeHref = z.string().trim().min(1).max(500).refine(
  (value) => value.startsWith("/") || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:"),
  "Use a local path, hash link, mailto, or tel link.",
);

export const serviceSchema = z.object({
  slug,
  title: shortText,
  eyebrow: shortText,
  icon,
  image: publicAssetPath,
  summary: mediumText,
  overview: longText,
  highlights: z.array(shortText).min(1).max(20),
  capabilities: z.array(shortText).min(1).max(30),
  workflow: z.array(shortText).min(1).max(20),
  technologies: z.array(shortText).max(40),
  industries: z.array(shortText).max(40),
  faq: z.array(z.object({ question: shortText, answer: longText })).max(30),
});

export const personSchema = z.object({
  slug,
  name: shortText,
  role: shortText,
  type: shortText,
  image: publicAssetPath,
  icon,
  summary: mediumText,
  professionalFocus: z.array(shortText).max(30),
  responsibilities: z.array(shortText).max(30),
  expertise: longText,
  linkedin: optionalHttpUrl,
});

const companySchema = z.object({
  name: z.literal("Team DRSA"),
  shortName: z.literal("Team DRSA"),
  logoPath: publicAssetPath,
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  phone: z.string().trim().max(60),
  address: z.string().trim().max(300),
  linkedin: optionalHttpUrl,
  tagline: mediumText,
  description: longText,
});

const heroSchema = z.object({
  badge: mediumText,
  headline: mediumText,
  description: longText,
  stats: z.array(z.object({ value: shortText, label: shortText })).min(1).max(8),
});

export const siteContentSchema = z.object({
  company: companySchema,
  hero: heroSchema,
  services: z.array(serviceSchema).min(1).max(30),
  leadership: z.array(personSchema).min(1).max(30),
  foundingTeam: z.array(personSchema).max(100),
  industries: z.array(z.object({ icon, title: shortText, description: mediumText })).max(50),
  projects: z.array(z.object({
    slug,
    title: shortText,
    sector: shortText,
    image: publicAssetPath,
    description: longText,
    status: z.enum(["published", "draft"]),
  })).max(100),
  caseStudies: z.array(z.object({
    slug,
    icon,
    title: shortText,
    summary: longText,
    outcome: longText,
    status: z.enum(["published", "draft"]),
  })).max(100),
  insights: z.array(z.object({
    slug,
    title: shortText,
    summary: longText,
    category: shortText,
    publishedAt: z.string().date(),
    status: z.enum(["published", "draft"]),
  })).max(500),
  careers: z.array(z.object({
    slug,
    title: shortText,
    location: shortText,
    type: shortText,
    summary: longText,
    status: z.enum(["open", "closed"]),
  })).max(200),
  support: z.array(z.object({ icon, title: shortText, description: mediumText, href: safeHref })).max(30),
  about: z.object({
    title: mediumText,
    subtitle: longText,
    values: z.array(z.object({ icon, title: shortText, description: mediumText })).min(1).max(12),
    deliverySteps: z.array(shortText).min(1).max(12),
  }),
}).superRefine((value, ctx) => {
  const groups: Array<[string, Array<{ slug: string }>]> = [
    ["services", value.services],
    ["leadership", value.leadership],
    ["foundingTeam", value.foundingTeam],
    ["projects", value.projects],
    ["caseStudies", value.caseStudies],
    ["insights", value.insights],
    ["careers", value.careers],
  ];
  for (const [name, items] of groups) {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.slug)) ctx.addIssue({ code: "custom", message: `Duplicate slug: ${item.slug}`, path: [name, index, "slug"] });
      seen.add(item.slug);
    });
  }
});

export const consultationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  organization: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(50).default(""),
  service: z.string().trim().min(2).max(160),
  details: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional().default(""),
});
