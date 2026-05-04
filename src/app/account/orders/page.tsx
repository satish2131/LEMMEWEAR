"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import {
  Package, ChevronLeft, ChevronRight, ShoppingBag,
  CheckCircle2, Truck, MapPin, Clock, Loader2, Eye
} from "lucide-react";
import { fetchOrders } from "@/lib/api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
}

interface Order {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  shipping: { fullName: string; city: string };
  payment: { method: string; status: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-50 border-blue-200", icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Package },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-50 border-purple-200", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-50 border-green-200", icon: MapPin },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50 border-red-200", icon: Clock },
};

const USER_EMAIL = "guest@lemmewear.com";

function OrderHistoryContent() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Order History — LemmeWear";
    if (!user?.email) return;
    fetchOrders(user.email)
      .then((res) => setOrders((res.data || []) as Order[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 gradient-hero opacity-40" aria-hidden />
          <div className="container relative py-12 lg:py-16">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Account
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-primary grid place-items-center shadow-glow">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">Order History</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {loading ? "Loading..." : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-10 max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-16 text-center shadow-soft">
              <div className="h-20 w-20 rounded-full bg-secondary mx-auto grid place-items-center mb-5">
                <ShoppingBag className="h-9 w-9 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                When you place your first order, it will appear here with real-time tracking.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link href="/shop/men">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const sc = statusConfig[order.status] || statusConfig.confirmed;
                const StatusIcon = sc.icon;
                const isExpanded = expandedOrder === order.orderNumber;

                return (
                  <div
                    key={order.orderNumber}
                    className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-smooth hover:shadow-card"
                  >
                    {/* Order header */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.orderNumber)}
                      className="w-full flex items-center gap-4 p-5 text-left"
                    >
                      <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 border ${sc.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${sc.color}`}>
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                          {" · "}
                          {order.items.length} item{order.items.length !== 1 && "s"}
                        </p>
                      </div>
                      <span className="font-bold text-lg shrink-0">₹{order.total.toLocaleString("en-IN")}</span>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-border p-5 space-y-4 animate-fade-up">
                        {/* Items */}
                        <div className="space-y-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <Link href={`/product/${item.slug}`}>
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0"
                                />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.color} · Size {item.size} · Qty {item.quantity}</p>
                              </div>
                              <span className="text-sm font-semibold shrink-0">₹{item.price.toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>

                        {/* Info grid */}
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Shipping to</p>
                            <p className="font-medium">{order.shipping.fullName}</p>
                            <p className="text-xs text-muted-foreground">{order.shipping.city}</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Payment</p>
                            <p className="font-medium capitalize">{order.payment.method.replace("cod", "Cash on Delivery")}</p>
                            <p className="text-xs text-muted-foreground capitalize">{order.payment.status}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm" className="gap-1.5">
                            <Link href={`/track`}>
                              <Eye className="h-3.5 w-3.5" /> Track Order
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <AuthGuard>
      <OrderHistoryContent />
    </AuthGuard>
  );
}
