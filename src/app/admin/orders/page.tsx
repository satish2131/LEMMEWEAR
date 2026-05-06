"use client";
import AdminShell from "@/components/admin/AdminShell";
import OrdersPage from "@/components/admin/pages/OrdersPage";

export default function AdminOrdersRoute() {
  return (
    <AdminShell>
      <OrdersPage />
    </AdminShell>
  );
}
