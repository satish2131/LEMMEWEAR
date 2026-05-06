"use client";
import AdminShell from "@/components/admin/AdminShell";
import GiftPacksSettingsPage from "@/components/admin/pages/GiftPacksSettingsPage";

export default function AdminGiftPacksSettingsRoute() {
  return (
    <AdminShell>
      <GiftPacksSettingsPage />
    </AdminShell>
  );
}
