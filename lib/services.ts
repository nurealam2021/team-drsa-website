

/*
  Service detail data for Team DRSA.

  IMPORTANT:
  These slugs match your current homepage service card slugs:
  cloud-security
  traditional-it
  network-security
  consultancy
  custom-software
  request-service

  Later you can edit all page content from this single file.
*/

export const serviceDetails = [
  {
    slug: "cloud-security",
    title: "Cloud Security Solutions",
    eyebrow: "Cloud Security",
    icon: "CloudCog",
    image: "/logo/logo.png",
    summary:
      "Enterprise-grade cloud protection for secure migration, governance, identity control, compliance readiness, and continuous visibility.",
    overview:
      "Team DRSA helps organizations design and operate secure cloud environments with a practical, risk-aware approach. The engagement is tailored to the client environment, risk profile, compliance needs, and delivery objectives.",
    highlights: [
      "Cloud landing zone security",
      "Identity and access governance",
      "Cloud posture and misconfiguration review",
      "Compliance-ready cloud architecture",
    ],
    capabilities: [
      "Cloud security assessment",
      "Secure cloud migration planning",
      "IAM and privilege review",
      "Cloud firewall and WAF planning",
      "SIEM and monitoring integration",
      "Cloud policy and governance documentation",
    ],
    workflow: [
      "Discovery and requirement analysis",
      "Current cloud risk assessment",
      "Target architecture and control design",
      "Implementation support",
      "Validation, documentation, and handover",
    ],
    technologies: ["AWS", "Azure", "Google Cloud", "IAM", "WAF", "SIEM", "DevSecOps"],
    industries: ["Enterprise", "Government", "Healthcare", "Education", "Finance", "Startups"],
    faq: [
      {
        question: "Can this service work with our existing cloud?",
        answer:
          "Yes. It can support existing cloud environments, new cloud landing zones, and migration projects.",
      },
      {
        question: "Can we update this page later?",
        answer:
          "Yes. Service scope, delivery stages, and commercial terms are tailored during discovery and proposal preparation.",
      },
    ],
  },
  {
    slug: "traditional-it",
    title: "Traditional IT Infrastructure",
    eyebrow: "Infrastructure Services",
    icon: "Server",
    image: "/logo/logo.png",
    summary:
      "Reliable server, storage, virtualization, backup, endpoint, and infrastructure lifecycle services for business-critical environments.",
    overview:
      "Team DRSA supports physical, virtual, and hybrid infrastructure for organizations that need reliable operations, modernization, resilience, and accountable technical delivery.",
    highlights: [
      "Infrastructure modernization",
      "Server and storage planning",
      "Backup and disaster recovery readiness",
      "Operational documentation and support",
    ],
    capabilities: [
      "Server and storage assessment",
      "Virtualization planning",
      "Backup and recovery design",
      "Endpoint and asset lifecycle support",
      "Infrastructure monitoring planning",
      "Maintenance and documentation",
    ],
    workflow: [
      "Infrastructure discovery",
      "Risk and capacity review",
      "Modernization roadmap",
      "Implementation and testing",
      "Handover and support planning",
    ],
    technologies: ["Linux", "Windows Server", "VMware", "Hyper-V", "Storage", "Backup", "Monitoring"],
    industries: ["Enterprise", "Education", "Healthcare", "Industrial", "Government", "NGO"],
    faq: [
      {
        question: "Is this only for on-premise systems?",
        answer:
          "No. It can support on-premise, hybrid, and infrastructure modernization projects.",
      },
      {
        question: "Can backup planning be included?",
        answer:
          "Yes. Backup, disaster recovery, and continuity planning can be included.",
      },
    ],
  },
  {
    slug: "network-security",
    title: "Network Design & Security",
    eyebrow: "Network Solutions",
    icon: "Network",
    image: "/logo/logo.png",
    summary:
      "Secure LAN, WAN, SD-WAN, firewall, VPN, segmentation, monitoring, and network architecture services.",
    overview:
      "Team DRSA provides secure network design for organizations that need stable connectivity, controlled access, and visibility. Delivery can include architecture diagrams, vendor-aligned designs, implementation planning, validation, and operational handover.",
    highlights: [
      "Secure network architecture",
      "Firewall and access control planning",
      "Segmentation and VPN design",
      "Monitoring and operational visibility",
    ],
    capabilities: [
      "LAN and WAN design",
      "Firewall architecture",
      "VPN and remote access",
      "Network segmentation",
      "NAC planning",
      "Network monitoring documentation",
    ],
    workflow: [
      "Network discovery",
      "Topology and risk review",
      "Architecture and policy design",
      "Deployment support",
      "Testing and documentation",
    ],
    technologies: ["Routing", "Switching", "Firewall", "VPN", "SD-WAN", "NAC", "IDS/IPS"],
    industries: ["Telecom", "Enterprise", "Government", "Industrial", "Healthcare", "Education"],
    faq: [
      {
        question: "Can this include firewall policy review?",
        answer:
          "Yes. Firewall rule review, policy cleanup, and secure access planning can be included.",
      },
      {
        question: "Can this support multi-branch offices?",
        answer:
          "Yes. It can support branch networks, VPN, SD-WAN, and centralized monitoring.",
      },
    ],
  },
  {
    slug: "consultancy",
    title: "IT Consultancy Services",
    eyebrow: "Technology Consultancy",
    icon: "BriefcaseBusiness",
    image: "/logo/logo.png",
    summary:
      "Strategic IT assessment, roadmap planning, technology audit, policy design, vendor evaluation, and architecture review.",
    overview:
      "Team DRSA provides independent technology advisory for planning, documentation, executive reporting, audits, governance, architecture review, and digital transformation decisions.",
    highlights: [
      "Technology roadmap planning",
      "IT audit and gap analysis",
      "Policy and governance design",
      "Vendor and solution evaluation",
    ],
    capabilities: [
      "IT assessment",
      "Digital transformation roadmap",
      "Security and infrastructure review",
      "Technology policy design",
      "Vendor comparison",
      "Executive report preparation",
    ],
    workflow: [
      "Stakeholder discovery",
      "Current-state assessment",
      "Gap and risk analysis",
      "Roadmap preparation",
      "Presentation and advisory support",
    ],
    technologies: ["IT Governance", "Security Frameworks", "Cloud Strategy", "Risk Management", "Documentation"],
    industries: ["Enterprise", "Government", "Education", "Healthcare", "NGO", "Startups"],
    faq: [
      {
        question: "Can this service help before a project starts?",
        answer:
          "Yes. It is useful before software, cloud, infrastructure, or security implementation.",
      },
      {
        question: "Can you prepare professional reports?",
        answer:
          "Yes. Reports, roadmaps, and technical documentation can be included.",
      },
    ],
  },
  {
    slug: "custom-software",
    title: "Custom Software Development",
    eyebrow: "Software Engineering",
    icon: "Code2",
    image: "/logo/logo.png",
    summary:
      "Custom web apps, ERP, CRM, SaaS platforms, APIs, automation, dashboards, and AI-ready enterprise systems.",
    overview:
      "Team DRSA builds software around real business workflows. Engagements follow a structured software lifecycle covering requirements, architecture, secure implementation, testing, deployment, documentation, and support.",
    highlights: [
      "Tailor-made enterprise applications",
      "ERP, CRM, and SaaS platforms",
      "API and automation solutions",
      "Scalable and secure architecture",
    ],
    capabilities: [
      "Enterprise web applications",
      "ERP and CRM systems",
      "SaaS product development",
      "API development",
      "Workflow automation",
      "Admin dashboard design",
      "Role-based access control",
    ],
    workflow: [
      "Business workflow discovery",
      "UX and system architecture",
      "Agile development",
      "Testing and deployment",
      "Training and support",
    ],
    technologies: ["Next.js", "React", "Node.js", "Python", "PostgreSQL", "MongoDB", "REST API"],
    industries: ["Enterprise", "Government", "Healthcare", "Education", "Industrial", "NGO", "Startups"],
    faq: [
      {
        question: "Can this build ERP and CRM systems?",
        answer:
          "Yes. ERP, CRM, SaaS, dashboards, portals, APIs, and automation systems can be developed.",
      },
      {
        question: "Can it integrate with existing systems?",
        answer:
          "Yes. APIs, databases, third-party services, and future AI-ready integrations can be supported.",
      },
    ],
  },
  {
    slug: "request-service",
    title: "Request Service",
    eyebrow: "Service Request",
    icon: "ArrowRight",
    image: "/logo/logo.png",
    summary:
      "A structured way to start a consultation for cloud security, infrastructure, networking, consultancy, or custom software.",
    overview:
      "Clients can use the consultation workflow to submit requirements, select a service area, and begin discovery. Team DRSA can then review the request, contact the client, and progress toward scope and proposal.",
    highlights: [
      "Structured consultation process",
      "Requirement discovery",
      "Service recommendation",
      "Scope and timeline planning",
    ],
    capabilities: [
      "Initial requirement review",
      "Technology and security discussion",
      "Recommended service path",
      "Scope planning",
      "Proposal preparation",
      "Implementation next steps",
    ],
    workflow: [
      "Submit request",
      "Discovery discussion",
      "Requirement and risk review",
      "Service recommendation",
      "Proposal and next-step planning",
    ],
    technologies: ["Consultation", "Requirement Analysis", "Project Planning", "Documentation"],
    industries: ["Enterprise", "Government", "Healthcare", "Education", "Industrial", "NGO", "Startups"],
    faq: [
      {
        question: "Can clients request multiple services together?",
        answer:
          "Yes. A single request can include security, infrastructure, networking, consultancy, and software.",
      },
      {
        question: "What happens after a request?",
        answer:
          "A discovery discussion is arranged to understand requirements, risk, timeline, and next steps.",
      },
    ],
  },
];

export type ServiceDetail = (typeof serviceDetails)[number];

export function getServiceBySlug(slug: string) {
  return serviceDetails.find((service) => service.slug === slug);
}
