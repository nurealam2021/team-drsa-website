import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";
import { adminIsConfigured, getCurrentAdminUser, toAdminUserView } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Team DRSA", robots: { index: false, follow: false } };

export default async function Page() {
  const user = await getCurrentAdminUser();
  if (user) return <AdminDashboard currentUser={toAdminUserView(user)} />;
  return <AdminLogin configured={await adminIsConfigured()} />;
}
