"use client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Plus, Minus, Tag, Gift, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { readActiveCart, writeActiveCart, activeCheckoutKey } from "@/lib/cartKey";

const initial: any[] = [];

const packagingOptions = [
  { id: "standard", label: "Standard Packaging", price: 0, desc: "Eco-friendly paper bag" },
  { id: "premium", label: "Premium Gift Box", price: 99, desc: "Rigid box with ribbon & tissue" },
  { id: "luxury", label: "Luxury Collector Box", price: 199, desc: "Premium box with velvet lining" },
];

const Cart = () => {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountFixed, setDiscountFixed] = useState(0);
  const [giftMessage, setGiftMessage] = useState("");
  const [packaging, setPackaging] = useState("standard");

  useEffect(() => {
    try {
      const parsedItems = readActiveCart();
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        setItems((prev) => {
          const existingIds = new Set(prev.map(i => i.id));
          const newItems = parsedItems.filter(i => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
      }
    } catch(e) {
      console.error("Failed to parse cart from local storage", e);
    }
  }, []);


  // Sync to localStorage whenever items change
  useEffect(() => {
    if (items !== initial) {
      writeActiveCart(items);
    }
  }, [items]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const packagingCost = packagingOptions.find((p) => p.id === packaging)?.price ?? 0;
  const discountAmt = discountFixed > 0
    ? Math.min(discountFixed, subtotal)
    : Math.round(subtotal * (discountPct / 100));
  const total = subtotal - discountAmt + packagingCost;

  const update = (id: number, d: number) => {
    setItems((prev) => {
      const newItems = prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
      syncToLocalStorage(newItems);
      return newItems;
    });
  };
  
  const remove = (id: number) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.id !== id);
      syncToLocalStorage(newItems);
      return newItems;
    });
  };

  const syncToLocalStorage = (currentItems: any[]) => {
    try {
      writeActiveCart(currentItems);
    } catch(e) {}
  };

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });
      const json = await res.json();
      if (json.success) {
        setAppliedCoupon(code);
        setDiscountPct(json.data.type === "percentage" ? json.data.value : 0);
        setDiscountFixed(json.data.type === "fixed" ? json.data.value : 0);
        toast.success(
          json.data.type === "percentage"
            ? `Coupon applied! ${json.data.value}% off`
            : `Coupon applied! ₹${json.data.value} off`
        );
      } else {
        toast.error(json.error || "Invalid coupon code");
      }
    } catch {
      toast.error("Could not validate coupon. Try again.");
    }
    setCoupon("");
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPct(0);
    setDiscountFixed(0);
    toast("Coupon removed");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1 container py-12">
        <h1 className="text-4xl lg:text-5xl font-bold mb-2">Your Cart</h1>
        <p className="text-muted-foreground mb-10">{items.length} item{items.length !== 1 && "s"}</p>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-16 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Discover our premium tees and gift packs.</p>
            <Button asChild variant="hero" size="lg"><Link href="/">Continue Shopping</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            {/* Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <Link href={`/product/${item.slug}`}>
                    <img src={item.image} alt={item.name} loading="lazy" className="h-24 w-24 rounded-xl object-cover shrink-0 bg-muted hover:opacity-90 transition-smooth" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold font-sans">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.color} · Size {item.size}</p>
                    <p className="font-bold mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => remove(item.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive transition-smooth">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1 border border-border rounded-lg">
                      <button onClick={() => update(item.id, -1)} className="h-8 w-8 grid place-items-center hover:bg-secondary rounded-l-lg" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <button onClick={() => update(item.id, 1)} className="h-8 w-8 grid place-items-center hover:bg-secondary rounded-r-lg" aria-label="Increase"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Gift Message */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">Add a Gift Message</Label>
                </div>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Write a personal message for the recipient..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <p className="text-xs text-muted-foreground">{giftMessage.length}/200 characters</p>
              </div>

              {/* Packaging */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">Choose Packaging</Label>
                </div>
                <div className="space-y-2">
                  {packagingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPackaging(opt.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-smooth ${
                        packaging === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary ml-4 shrink-0">
                        {opt.price === 0 ? "Free" : `+₹${opt.price}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft h-fit space-y-5">
              <h2 className="font-bold text-lg font-sans">Order Summary</h2>

              {/* Coupon */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Coupon Code
                </Label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-primary">{appliedCoupon} · {discountPct}% off</span>
                    <button onClick={removeCoupon} className="text-xs text-muted-foreground hover:text-destructive ml-2">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      placeholder="Enter code (e.g. LUME10)"
                      className="text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={applyCoupon} className="shrink-0">Apply</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Discount ({discountPct}%)</span><span>−₹{discountAmt.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {packagingCost > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Packaging</span><span>+₹{packagingCost}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-primary">Free</span></div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between font-bold">
                <span>Total</span>
                <span className="gradient-text text-xl">₹{total.toLocaleString("en-IN")}</span>
              </div>

              <Button variant="hero" size="lg" className="w-full" onClick={() => {
                localStorage.setItem(activeCheckoutKey(), JSON.stringify({ items, total, subtotal }));
                router.push('/checkout');
              }}>
                Proceed to Checkout
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
