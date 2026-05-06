"use client";
import AdminShell from "@/components/admin/AdminShell";
import CustomersPage from "@/components/admin/pages/CustomersPage";

export default function AdminCustomersRoute() {
  return (
    <AdminShell>
      <CustomersPage />
    </AdminShell>
  );
}
