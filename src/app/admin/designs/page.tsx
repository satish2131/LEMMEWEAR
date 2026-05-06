"use client";
import AdminShell from "@/components/admin/AdminShell";
import DesignsPage from "@/components/admin/pages/DesignsPage";

export default function AdminDesignsRoute() {
  return (
    <AdminShell>
      <DesignsPage />
    </AdminShell>
  );
}
