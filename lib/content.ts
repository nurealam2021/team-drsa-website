import { foundingTeamPeople, leadershipPeople } from "@/lib/people";
import { serviceDetails } from "@/lib/services";

export type CompanySettings = {
  name: string;
  shortName: string;
  logoPath: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  tagline: string;
  description: string;
};

export type SiteContent = {
  company: CompanySettings;
  hero: {
    badge: string;
    headline: string;
    description: string;
    stats: Array<{ value: string; label: string }>;
  };
  services: typeof serviceDetails;
  leadership: typeof leadershipPeople;
  foundingTeam: typeof foundingTeamPeople;
  industries: Array<{ icon: string; title: string; description: string }>;
  projects: Array<{ slug: string; title: string; sector: string; image: string; description: string; status: "published" | "draft" }>;
  caseStudies: Array<{ slug: string; icon: string; title: string; summary: string; outcome: string; status: "published" | "draft" }>;
  insights: Array<{ slug: string; title: string; summary: string; category: string; publishedAt: string; status: "published" | "draft" }>;
  careers: Array<{ slug: string; title: string; location: string; type: string; summary: string; status: "open" | "closed" }>;
  support: Array<{ icon: string; title: string; description: string; href: string }>;
  about: {
    title: string;
    subtitle: string;
    values: Array<{ icon: string; title: string; description: string }>;
    deliverySteps: string[];
  };
};

export const defaultSiteContent: SiteContent = {
  company: {
    name: "Team DRSA",
    shortName: "Team DRSA",
    logoPath: "/logo/logo.png",
    email: "",
    phone: "",
    address: "Available by consultation",
    linkedin: "https://www.linkedin.com/in/md-nur-e-alam-266935156/",
    tagline: "Secure infrastructure. Custom software. Enterprise outcomes.",
    description:
      "Cybersecurity, infrastructure, consultancy, and custom software engineering for organizations that require trust, scalability, and control.",
  },
  hero: {
    badge: "Protecting the digital world with enterprise-grade technology",
    headline: "Secure infrastructure. Custom software. Enterprise outcomes.",
    description:
      "Cloud security, resilient infrastructure, network protection, IT consultancy, and custom enterprise applications delivered through one security-first technology team.",
    stats: [
      { value: "Security-first", label: "Delivery principle" },
      { value: "24/7-ready", label: "Operational design" },
      { value: "6", label: "Core service areas" },
      { value: "End-to-end", label: "Delivery lifecycle" },
    ],
  },
  services: serviceDetails,
  leadership: leadershipPeople,
  foundingTeam: [],
  industries: [
    { icon: "Landmark", title: "Government", description: "Secure digital services, citizen platforms, compliance, and infrastructure modernization." },
    { icon: "Building2", title: "Enterprise", description: "Departmental platforms, secure cloud, governance, automation, and integration." },
    { icon: "HeartPulse", title: "Healthcare", description: "Privacy-first platforms, protected records, workflows, and audit-friendly systems." },
    { icon: "GraduationCap", title: "Education", description: "Campus networks, learning platforms, portals, security controls, and administration tools." },
    { icon: "Factory", title: "Industrial", description: "Operational systems, secure networks, reporting, monitoring, and automation." },
    { icon: "Globe2", title: "NGO & Global Teams", description: "Project systems, reporting, secure collaboration, and field operations." },
  ],
  projects: [
    { slug: "enterprise-security-dashboard", title: "Enterprise Security Dashboard", sector: "Cybersecurity", image: "/projects/project-0111.jpg", description: "Security monitoring, risk visibility, audit logs, and executive reporting in one operational view.", status: "published" },
    { slug: "digital-service-platform", title: "Digital Service Platform", sector: "Enterprise Workflow", image: "/projects/project-02.jpg", description: "Secure workflow automation designed for structured, high-volume business and service operations.", status: "published" },
    { slug: "custom-erp-system", title: "Custom ERP System", sector: "Business Operations", image: "/projects/project-03.jpg", description: "Integrated modules for operations, approvals, reporting, service delivery, and management visibility.", status: "published" },
    { slug: "network-operations-platform", title: "Network Operations Platform", sector: "Network & Infrastructure", image: "/projects/project-04.jpg", description: "Operational tooling that improves network visibility, structured workflows, and technical decision-making.", status: "published" },
  ],
  caseStudies: [
    { slug: "security-monitoring-modernization", icon: "DatabaseZap", title: "Security Monitoring Modernization", summary: "Centralized security telemetry and operational visibility for faster investigation and better governance.", outcome: "Improved detection visibility, auditability, and response readiness.", status: "published" },
    { slug: "enterprise-workflow-digitalization", icon: "Layers3", title: "Enterprise Workflow Digitalization", summary: "Converted multi-team approval and service-delivery processes into controlled digital workflows.", outcome: "Clearer ownership, traceability, and management visibility.", status: "published" },
    { slug: "network-operations-visibility", icon: "Network", title: "Network Operations Visibility", summary: "Connected infrastructure data with practical operational tooling for technical teams.", outcome: "Faster access to network information and more consistent operational decisions.", status: "published" },
  ],
  insights: [
    { slug: "zero-trust-enterprise-networks", title: "Zero Trust for enterprise networks", summary: "A practical introduction to identity, segmentation, verification, and monitoring for modern enterprise networks.", category: "Cybersecurity", publishedAt: "2026-08-01", status: "published" },
    { slug: "cloud-security-posture-checklist", title: "Cloud security posture checklist", summary: "Core areas to review across identity, configuration, logging, exposure, governance, and resilience.", category: "Cloud Security", publishedAt: "2026-08-10", status: "published" },
    { slug: "when-custom-erp-is-right", title: "When custom ERP is the right decision", summary: "How to decide whether business workflows justify a purpose-built application instead of generic software.", category: "Software Engineering", publishedAt: "2026-08-20", status: "published" },
  ],
  careers: [],
  support: [
    { icon: "Headphones", title: "Support requests", description: "Existing clients can contact the team for service assistance and operational follow-up.", href: "#contact" },
    { icon: "FileText", title: "Documentation", description: "Project documentation, handover material, and support knowledge can be delivered with each engagement.", href: "#contact" },
    { icon: "ShieldCheck", title: "Security response", description: "Security-related service requests are handled through a controlled consultation and response workflow.", href: "#contact" },
  ],
  about: {
    title: "A modern technology company built for secure, mission-critical transformation.",
    subtitle: "Team DRSA combines cybersecurity, infrastructure, networking, consultancy, and software engineering so clients can work with one accountable technology team.",
    values: [
      { icon: "ShieldCheck", title: "Security-first thinking", description: "Security, privacy, access control, and operational resilience are considered from the beginning." },
      { icon: "Layers3", title: "Enterprise-grade delivery", description: "Requirements, architecture, implementation, validation, documentation, and handover follow a structured lifecycle." },
      { icon: "Code2", title: "Practical customization", description: "Solutions are designed around real business and technical workflows instead of unnecessary complexity." },
    ],
    deliverySteps: ["Discovery and advisory", "Secure architecture", "Implementation and development", "Testing, deployment, and support"],
  },
};
