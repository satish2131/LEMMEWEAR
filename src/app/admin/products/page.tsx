"use client";
import AdminShell from "@/components/admin/AdminShell";
import ProductsPage from "@/components/admin/pages/ProductsPage";

export default function AdminProductsRoute() {
  return (
    <AdminShell>
      <ProductsPage />
    </AdminShell>
  );
}
