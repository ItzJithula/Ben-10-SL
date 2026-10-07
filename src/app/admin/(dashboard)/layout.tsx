import { redirect } from "next/navigation";

import AdminNav from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <AdminNav logoUrl={settings.logo_url || "/logo.svg"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
