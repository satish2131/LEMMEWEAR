"use client";
import AdminShell from "@/components/admin/AdminShell";
import TrendingSettingsPage from "@/components/admin/pages/TrendingSettingsPage";

export default function AdminTrendingSettingsRoute() {
  return (
    <AdminShell>
      <TrendingSettingsPage />
    </AdminShell>
  );
}
