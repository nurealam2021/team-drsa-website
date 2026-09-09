import EnterpriseWebsite from "@/components/EnterpriseWebsite";
import { getSiteContent } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getSiteContent();
  return <EnterpriseWebsite content={content} />;
}
