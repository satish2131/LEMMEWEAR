"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin, CreditCard, Smartphone, Banknote, Truck,
  ChevronRight, Lock, Loader2, ChevronDown, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAddresses } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { activeCheckoutKey } from "@/lib/cartKey";

// ─── Razorpay types ───────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = ["Shipping", "Payment", "Review"];

const paymentMethods = [
  { id: "upi"        as const, label: "UPI",                 icon: Smartphone, desc: "GPay, PhonePe, Paytm, BHIM" },
  { id: "card"       as const, label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, Rupay" },
  { id: "netbanking" as const, label: "Net Banking",         icon: Banknote,   desc: "All major banks supported" },
  { id: "cod"        as const, label: "Cash on Delivery",    icon: Truck,      desc: "Pay when you receive" },
];

interface SavedAddress {
  _id: string; label: string; fullName: string; phone: string;
  address: string; city: string; state: string; pincode: string; isDefault: boolean;
}

// ─── Load Razorpay script ─────────────────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
const Checkout = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep]         = useState(0);
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "netbanking" | "cod">("upi");
  const [placing, setPlacing]   = useState(false);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "",
  });
  const [cartItems, setCartItems]   = useState<any[]>([]);
  const [totals, setTotals]         = useState({ subtotal: 0, total: 0 });

  const [savedAddresses, setSavedAddresses]     = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  // Pre-fill from user + load saved addresses
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name  || "",
      email:    prev.email    || user.email || "",
      phone:    prev.phone    || user.phone || "",
      city:     prev.city     || user.city  || "",
    }));
    fetchAddresses(user.email)
      .then((res) => {
        const addrs = (res.data || []) as SavedAddress[];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          const def = addrs.find((a) => a.isDefault) || addrs[0];
          applyAddress(def);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const applyAddress = (addr: SavedAddress) => {
    setForm((prev) => ({
      ...prev,
      fullName: addr.fullName, phone: addr.phone,
      address:  addr.address,  city:  addr.city,
      state:    addr.state,    pincode: addr.pincode,
    }));
    setSelectedAddressId(addr._id);
    setShowAddressPicker(false);
  };

  // Load cart
  useEffect(() => {
    try {
      const saved = localStorage.getItem(activeCheckoutKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items)) {
          setCartItems(parsed.items.map((i: any) => ({
            ...i,
            quantity:  i.qty || i.quantity || 1,
            productId: i.productId || i.id?.toString() || Date.now().toString(),
            slug:      i.slug  || `custom-item-${i.id || Date.now()}`,
            name:      i.name  || "Custom Item",
            image:     i.image || "/assets/hero-tshirt.jpg",
            color:     i.color || "Custom",
            size:      i.size  || "M",
          })));
          setTotals({ subtotal: parsed.subtotal || 0, total: parsed.total || 0 });
        }
      }
    } catch (e) { console.error("Failed to parse checkout state", e); }
  }, []);

  // ── Place order ─────────────────────────────────────────────────────────────
  const placeOrder = async () => {
    setPlacing(true);
    try {
      const orderPayload = {
        items:    cartItems,
        subtotal: totals.subtotal,
        total:    totals.total,
        shipping: {
          fullName: form.fullName, email: form.email, phone: form.phone,
          address:  form.address,  city:  form.city,  state: form.state,
          pincode:  form.pincode,
        },
      };

      // ── COD: skip Razorpay, create order directly ──────────────────────
      if (payMethod === "cod") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...orderPayload, payment: { method: "cod" } }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        sessionStorage.setItem("lastOrderNumber", json.data.orderNumber);
        toast.success("Order placed successfully!");
        router.push("/order-confirmation");
        return;
      }

      // ── Online payment: create Razorpay order ──────────────────────────
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Payment gateway failed to load. Please try again.");

      const rzpOrderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:  totals.total,
          receipt: `rcpt_${Date.now()}`,
        }),
      });
      const rzpOrderJson = await rzpOrderRes.json();
      if (!rzpOrderJson.success) throw new Error(rzpOrderJson.error);

      const { orderId, amount, currency } = rzpOrderJson.data;

      // ── Open Razorpay checkout popup ───────────────────────────────────
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount,
          currency,
          name:        "LemmeWear",
          description: `Order for ${form.fullName}`,
          order_id:    orderId,
          prefill: {
            name:    form.fullName,
            email:   form.email,
            contact: form.phone,
          },
          theme: { color: "#7c3aed" },
          handler: async (response: RazorpayResponse) => {
            try {
              // ── Verify signature + create DB order ─────────────────────
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...response,
                  ...orderPayload,
                  payment: { method: payMethod },
                }),
              });
              const verifyJson = await verifyRes.json();
              if (!verifyJson.success) throw new Error(verifyJson.error);

              sessionStorage.setItem("lastOrderNumber", verifyJson.data.orderNumber);
              toast.success("Payment successful! Order confirmed.");
              router.push("/payment-success");
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        });
        rzp.open();
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      if (msg !== "Payment cancelled") {
        router.push("/payment-failed");
      } else {
        toast("Payment cancelled");
      }
    } finally {
      setPlacing(false);
    }
  };

  const nextStep = async () => {
    if (step === 0) {
      const missing = Object.entries(form).find(([, v]) => !v.trim());
      if (missing) { toast.error("Please fill all shipping details"); return; }
    }
    if (step < 2) { setStep((s) => s + 1); }
    else          { await placeOrder(); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />
      <main className="flex-1 container py-12 max-w-5xl">
        <h1 className="text-4xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-10">Secure, encrypted checkout</p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 text-sm font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
                <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < step ? "bg-primary border-primary text-primary-foreground"
                  : i === step ? "border-primary text-primary"
                  : "border-border text-muted-foreground"
                }`}>{i < step ? "✓" : i + 1}</span>
                {s}
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div>

            {/* ── Step 0: Shipping ── */}
            {step === 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-bold font-sans text-lg">Shipping Address</h2>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">
                        {savedAddresses.length} saved address{savedAddresses.length > 1 ? "es" : ""}
                      </p>
                      <button type="button" onClick={() => setShowAddressPicker((v) => !v)}
                        className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                        Change <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAddressPicker ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    {showAddressPicker && (
                      <div className="space-y-2 animate-fade-up">
                        {savedAddresses.map((addr) => (
                          <button key={addr._id} type="button" onClick={() => applyAddress(addr)}
                            className={`w-full text-left p-3 rounded-xl border transition-smooth ${
                              selectedAddressId === addr._id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                            }`}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{addr.label}</span>
                              {addr.isDefault && <span className="text-[10px] font-bold text-primary">Default</span>}
                            </div>
                            <p className="text-sm font-semibold">{addr.fullName}</p>
                            <p className="text-xs text-muted-foreground">{addr.address}, {addr.city} – {addr.pincode}</p>
                          </button>
                        ))}
                        <button type="button"
                          onClick={() => {
                            setSelectedAddressId(null); setShowAddressPicker(false);
                            setForm((prev) => ({ ...prev, fullName: user?.name || "", phone: user?.phone || "",
                              address: "", city: user?.city || "", state: "", pincode: "" }));
                          }}
                          className="w-full text-left p-3 rounded-xl border border-dashed border-border hover:border-primary/40 transition-smooth">
                          <p className="text-sm text-muted-foreground">+ Enter a new address</p>
                        </button>
                      </div>
                    )}

                    {!showAddressPicker && selectedAddressId && (
                      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-sm">
                        <p className="font-semibold">{form.fullName}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{form.address}, {form.city}, {form.state} – {form.pincode}</p>
                        <p className="text-muted-foreground text-xs">{form.phone}</p>
                      </div>
                    )}
                  </div>
                )}

                {(!selectedAddressId || savedAddresses.length === 0) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Full Name</Label><Input value={form.fullName} onChange={set("fullName")} placeholder="Rahul Sharma" className="mt-1.5" /></div>
                    <div><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} placeholder="rahul@email.com" className="mt-1.5" /></div>
                    <div><Label>Phone</Label><Input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 99999 99999" className="mt-1.5" /></div>
                    <div className="sm:col-span-2"><Label>Full Address</Label><Input value={form.address} onChange={set("address")} placeholder="House no., Street, Area" className="mt-1.5" /></div>
                    <div><Label>City</Label><Input value={form.city} onChange={set("city")} placeholder="Mumbai" className="mt-1.5" /></div>
                    <div><Label>State</Label><Input value={form.state} onChange={set("state")} placeholder="Maharashtra" className="mt-1.5" /></div>
                    <div><Label>Pincode</Label><Input value={form.pincode} onChange={set("pincode")} placeholder="400001" className="mt-1.5" /></div>
                  </div>
                )}

                {selectedAddressId && savedAddresses.length > 0 && (
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={set("email")} placeholder="rahul@email.com" className="mt-1.5" />
                  </div>
                )}
              </div>
            )}

            {/* ── Step 1: Payment ── */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-bold font-sans text-lg">Payment Method</h2>
                </div>
                {paymentMethods.map((m) => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-smooth ${
                      payMethod === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}>
                    <div className={`h-10 w-10 rounded-lg grid place-items-center ${payMethod === m.id ? "gradient-primary text-primary-foreground" : "bg-secondary"}`}>
                      <m.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 ${payMethod === m.id ? "border-primary bg-primary" : "border-border"}`} />
                  </button>
                ))}

                {/* Razorpay badge for online methods */}
                {payMethod !== "cod" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    Secured by Razorpay · 256-bit SSL encryption
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Review ── */}
            {step === 2 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
                <h2 className="font-bold font-sans text-lg">Review Your Order</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[200px]">{form.address}, {form.city} – {form.pincode}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium">
                      {payMethod === "cod" ? "Cash on Delivery" : payMethod === "netbanking" ? "Net Banking" : payMethod.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {payMethod === "cod"
                    ? "Pay cash when your order arrives. No online payment needed."
                    : "You'll be redirected to Razorpay's secure payment page to complete payment."}
                </div>
              </div>
            )}

            <Button variant="hero" size="lg" className="w-full mt-5" onClick={nextStep} disabled={placing}>
              {placing
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {payMethod === "cod" ? "Placing Order..." : "Processing Payment..."}</>
                : step === 2
                  ? payMethod === "cod" ? "Place Order" : `Pay ₹${totals.total.toLocaleString("en-IN")}`
                  : "Continue →"}
            </Button>
            {step > 0 && (
              <Button variant="outline" size="lg" className="w-full mt-2" onClick={() => setStep((s) => s - 1)} disabled={placing}>
                ← Back
              </Button>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="rounded-2xl border border-border bg-card p-5 shadow-soft h-fit space-y-3">
            <h2 className="font-bold font-sans">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {cartItems.map((item, idx) => (
                <div key={item.productId || idx} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.name}{item.size ? ` (${item.size})` : ""}{item.quantity > 1 ? ` x${item.quantity}` : ""}
                  </span>
                  <span>₹{item.price.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-primary">Free</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="gradient-text text-lg">₹{totals.total.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-muted-foreground">Estimated delivery: 5–7 business days</p>
            {payMethod !== "cod" && (
              <div className="flex items-center gap-1.5 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                <span className="text-[11px] text-green-600 font-medium">Secured by Razorpay</span>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
