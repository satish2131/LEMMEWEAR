"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle2, Package, Truck, MapPin, Clock, Loader2 } from "lucide-react";
import { fetchOrder } from "@/lib/api";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface OrderResult {
  orderNumber: string;
  status: string;
  shipping: {
    fullName: string;
    city: string;
  };
  estimatedDelivery?: string;
  items: { name: string; size: string }[];
  trackingId?: string;
}

const statusSteps = ["confirmed", "processing", "shipped", "delivered"];

const steps = [
  { icon: CheckCircle2, label: "Order Confirmed", desc: "Order placed & payment received" },
  { icon: Package, label: "Processing", desc: "Printing, packing & quality check" },
  { icon: Truck, label: "Shipped", desc: "On the way with our courier partner" },
  { icon: MapPin, label: "Delivered", desc: "Delivered to your address" },
];

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<OrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Track Order — LemmeWear";
  }, []);

  const track = async () => {
    const id = orderId.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await fetchOrder(id);
      const order = res.data as OrderResult;
      if (order) {
        setResult(order);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const statusIndex = result
    ? statusSteps.indexOf(result.status)
    : -1;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 gradient-hero opacity-40" aria-hidden />
          <div className="container relative py-16 lg:py-24 max-w-2xl">
            <p className="text-sm font-medium text-primary mb-3">Order Tracking</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">Track Your <span className="gradient-text">Order</span></h1>
            <p className="text-muted-foreground">Enter your order ID to get real-time updates on your delivery.</p>
          </div>
        </section>

        <section className="container py-12 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft mb-8">
            <Label className="font-semibold mb-2 block">Order ID</Label>
            <div className="flex gap-3">
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && track()}
                placeholder="e.g. LW-M9X4K2-1234"
                className="font-mono text-sm"
              />
              <Button variant="hero" onClick={track} className="gap-2 shrink-0" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Track
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter the order number from your confirmation email (starts with LW-)
            </p>
          </div>

          {notFound && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
              <p className="font-semibold text-destructive mb-1">Order not found</p>
              <p className="text-sm text-muted-foreground">Please check your order ID and try again.</p>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Order info */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h2 className="font-bold font-sans mb-3">Order Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-semibold">{result.orderNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{result.shipping.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery to</span><span>{result.shipping.city}</span></div>
                  {result.estimatedDelivery && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Est. Delivery</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(result.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                  )}
                  {result.trackingId && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Tracking ID</span><span className="font-mono">{result.trackingId}</span></div>
                  )}
                  <div><p className="text-muted-foreground mb-1">Items</p>
                    <ul className="space-y-0.5">{result.items.map((i) => <li key={i.name} className="text-foreground">• {i.name} ({i.size})</li>)}</ul>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h2 className="font-bold font-sans mb-5">Delivery Status</h2>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {steps.map((s, i) => {
                      const done = i <= statusIndex;
                      const active = i === statusIndex;
                      return (
                        <div key={i} className="flex items-start gap-4 relative">
                          <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-smooth ${
                            done ? "gradient-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground border border-border"
                          } ${active ? "ring-4 ring-primary/20" : ""}`}>
                            <s.icon className="h-5 w-5" />
                          </div>
                          <div className="pt-1.5">
                            <p className={`font-semibold text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                              {s.label} {active && <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">Current</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{s.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default function TrackOrderPage() {
  return (
    <AuthGuard>
      <TrackOrder />
    </AuthGuard>
  );
}
