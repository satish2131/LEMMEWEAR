"use client";
import AdminShell from "@/components/admin/AdminShell";
import CouponsPage from "@/components/admin/pages/CouponsPage";

export default function AdminCouponsRoute() {
  return (
    <AdminShell>
      <CouponsPage />
    </AdminShell>
  );
}
