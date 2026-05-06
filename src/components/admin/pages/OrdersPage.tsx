"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
  color: string;
  size: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  shipping: { fullName: string; email: string; address: string; city: string; state: string; pincode: string };
  items: OrderItem[];
  total: number;
  status: string;
  payment: { method: string; status: string };
  packagingType: string;
  createdAt: string;
}

const statusColor: Record<string, string> = {
  delivered: "bg-green-500/15 text-green-600 border-green-500/20",
  shipped: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  processing: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-purple-500/15 text-purple-600 border-purple-500/20",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/20",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [sheetStatus, setSheetStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const openSheet = (order: Order) => {
    setSelected(order);
    setSheetStatus(order.status);
  };

  const updateStatus = async () => {
    if (!selected || !sheetStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${selected.orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: sheetStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === selected.orderNumber ? { ...o, status: sheetStatus } : o))
        );
        setSelected((prev) => (prev ? { ...prev, status: sheetStatus } : null));
        toast.success("Order status updated");
      } else {
        toast.error(json.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage and track all customer orders</p>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">All Orders</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-56 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or customer..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Order #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Date</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Payment</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Search className="mx-auto h-10 w-10 text-muted-foreground/30" />
                        <p className="mt-3 text-sm text-muted-foreground">No orders found</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr
                        key={o._id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => openSheet(o)}
                      >
                        <td className="py-3 font-medium">{o.orderNumber}</td>
                        <td className="py-3">{o.shipping.fullName}</td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[11px]">
                            {o.payment.method.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${statusColor[o.status] || ""}`}
                          >
                            {capitalize(o.status)}
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-medium">₹{o.total.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); openSheet(o); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.orderNumber}
                  <Badge
                    variant="outline"
                    className={`text-[11px] ${statusColor[selected.status] || ""}`}
                  >
                    {capitalize(selected.status)}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Customer
                  </h4>
                  <p className="text-sm font-medium">{selected.shipping.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selected.shipping.email}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Shipping Address
                  </h4>
                  <p className="text-sm">
                    {selected.shipping.address}, {selected.shipping.city},{" "}
                    {selected.shipping.state} - {selected.shipping.pincode}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Items
                  </h4>
                  <div className="space-y-3">
                    {selected.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3"
                      >
                        {/* Show actual product image, fallback to a styled placeholder */}
                        {item.image && !item.image.includes("hero-tshirt") ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover shrink-0 bg-muted"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${
                            item.image && !item.image.includes("hero-tshirt") ? "hidden" : ""
                          }`}
                        >
                          <span className="text-xl">👕</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                            {item.color && item.color !== "Custom" ? ` · ${item.color}` : ""}
                            {item.size && item.size !== "M" ? ` · ${item.size}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-medium shrink-0">₹{item.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Packaging</span>
                  <span className="font-medium capitalize">{selected.packagingType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium uppercase">{selected.payment.method}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>₹{selected.total.toLocaleString()}</span>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Update Status
                  </h4>
                  <div className="flex gap-2">
                    <Select value={sheetStatus} onValueChange={setSheetStatus}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={updateStatus} disabled={updating} className="h-9">
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
