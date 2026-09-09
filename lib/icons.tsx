import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CloudCog,
  Code2,
  DatabaseZap,
  Factory,
  FileText,
  Globe2,
  GraduationCap,
  Headphones,
  HeartPulse,
  Landmark,
  Layers3,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react";

export function SiteIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "ArrowRight": return <ArrowRight className={className} />;
    case "BriefcaseBusiness": return <BriefcaseBusiness className={className} />;
    case "Building2": return <Building2 className={className} />;
    case "CloudCog": return <CloudCog className={className} />;
    case "Code2": return <Code2 className={className} />;
    case "DatabaseZap": return <DatabaseZap className={className} />;
    case "Factory": return <Factory className={className} />;
    case "FileText": return <FileText className={className} />;
    case "Globe2": return <Globe2 className={className} />;
    case "GraduationCap": return <GraduationCap className={className} />;
    case "Headphones": return <Headphones className={className} />;
    case "HeartPulse": return <HeartPulse className={className} />;
    case "Landmark": return <Landmark className={className} />;
    case "Layers3": return <Layers3 className={className} />;
    case "Network": return <Network className={className} />;
    case "Server": return <Server className={className} />;
    default: return <ShieldCheck className={className} />;
  }
}
