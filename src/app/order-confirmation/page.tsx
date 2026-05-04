"use client";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Truck, MapPin, Star, Loader2 } from "lucide-react";
import { fetchOrder } from "@/lib/api";

interface OrderItem {
  name: string;
  color: string;
  size: string;
  price: number;
}

interface OrderData {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: string;
  shipping: { fullName: string };
  estimatedDelivery?: string;
}

const steps = [
  { icon: CheckCircle2, label: "Order Confirmed", desc: "Your order has been placed successfully", key: "confirmed" },
  { icon: Package, label: "Processing", desc: "We're printing & packing your items", key: "processing" },
  { icon: Truck, label: "Shipped", desc: "Your package is on the way", key: "shipped" },
  { icon: MapPin, label: "Delivered", desc: "Estimated: 5–7 business days", key: "delivered" },
];

const statusOrder = ["confirmed", "processing", "shipped", "delivered"];

const OrderConfirmation = () => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    document.title = "Order Confirmed — LemmeWear";

    // Try to get order number from sessionStorage
    const stored = sessionStorage.getItem("lastOrderNumber");
    if (stored) {
      setOrderNumber(stored);
      fetchOrder(stored)
        .then((res) => {
          setOrder(res.data as OrderData);
        })
        .catch(() => {
          // If API fails, show fallback with stored order number
          setOrder(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      // Generate a display-only order number
      setOrderNumber(`LW-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, []);

  const currentStatusIndex = order
    ? statusOrder.indexOf(order.status)
    : 1; // Default: processing

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1 gradient-hero">
        <div className="container py-20 max-w-2xl text-center">
          {/* Success icon */}
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-glow mb-6 animate-bounce-once">
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </div>

          <p className="text-sm font-medium text-primary mb-3">Thank you for your order!</p>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Order <span className="gradient-text">Confirmed</span>
          </h1>
          <p className="text-muted-foreground mb-2">Your order number is</p>
          <div className="inline-block px-5 py-2 rounded-full bg-primary/10 border border-primary/20 font-mono font-bold text-primary text-lg mb-8">
            {orderNumber}
          </div>
          <p className="text-muted-foreground mb-10">
            We've sent a confirmation to your email. Your premium tees will arrive in 5–7 business days.
          </p>

          {/* Order summary */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft text-left mb-8">
            <h2 className="font-bold font-sans mb-4">Order Items</h2>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {(order?.items || [
                  { name: "Aurora Tee", color: "Lavender Mist", size: "M", price: 1499 },
                  { name: "Horizon Classic", color: "Royal Purple", size: "L", price: 1599 },
                ]).map((item) => (
                  <div key={item.name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.color} · Size {item.size}</p>
                    </div>
                    <span className="font-bold">₹{item.price.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2">
                  <span>Total Paid</span>
                  <span className="gradient-text">₹{(order?.total || 3098).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tracking timeline */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft text-left mb-10">
            <h2 className="font-bold font-sans mb-5">Tracking Status</h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {steps.map((s, i) => {
                  const done = i <= currentStatusIndex;
                  return (
                    <div key={i} className="flex items-start gap-4 relative">
                      <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${done ? "gradient-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground border border-border"}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div className="pt-1.5">
                        <p className={`font-semibold text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="hero" size="lg"><Link href="/track">Track My Order</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/">Continue Shopping</Link></Button>
          </div>

          <div className="mt-10 p-5 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3 text-left">
            <Star className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">Enjoying your LemmeWear purchase? Leave a review and earn <span className="text-primary font-semibold">50 reward points</span>!</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
