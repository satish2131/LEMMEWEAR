"use client";
import AdminShell from "@/components/admin/AdminShell";
import ReviewsPage from "@/components/admin/pages/ReviewsPage";

export default function AdminReviewsRoute() {
  return (
    <AdminShell>
      <ReviewsPage />
    </AdminShell>
  );
}
