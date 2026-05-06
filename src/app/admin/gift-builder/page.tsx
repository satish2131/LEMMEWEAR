"use client";
import AdminShell from "@/components/admin/AdminShell";
import GiftBuilderSettingsPage from "@/components/admin/pages/GiftBuilderSettingsPage";

export default function AdminGiftBuilderRoute() {
  return (
    <AdminShell>
      <GiftBuilderSettingsPage />
    </AdminShell>
  );
}
