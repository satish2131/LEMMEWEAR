"use client";
import { use } from "react";
import ProductPage from "@/components/pages/ProductPage";
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ProductPage slug={slug} />;
}
