"use client";
import AdminShell from "@/components/admin/AdminShell";
import ContactSettingsPage from "@/components/admin/pages/ContactSettingsPage";

export default function AdminContactSettingsRoute() {
  return (
    <AdminShell>
      <ContactSettingsPage />
    </AdminShell>
  );
}
