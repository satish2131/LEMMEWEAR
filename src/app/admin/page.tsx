"use client";
import AdminShell from "@/components/admin/AdminShell";
import DashboardPage from "@/components/admin/pages/DashboardPage";

export default function AdminPage() {
  return (
    <AdminShell>
      <DashboardPage />
    </AdminShell>
  );
}
