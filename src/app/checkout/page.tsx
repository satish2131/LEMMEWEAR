"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, CreditCard, Smartphone, Banknote, Truck, ChevronRight, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STEPS = ["Shipping", "Payment", "Review"];

const paymentMethods = [
  { id: "upi" as const, label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm, BHIM" },
  { id: "card" as const, label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, Rupay" },
  { id: "netbanking" as const, label: "Net Banking", icon: Banknote, desc: "All major banks supported" },
  { id: "cod" as const, label: "Cash on Delivery", icon: Truck, desc: "Pay when you receive" },
];

const Checkout = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "netbanking" | "cod">("upi");
  const [upi, setUpi] = useState("");
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "",
  });
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totals, setTotals] = useState({ subtotal: 0, total: 0 });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        city: prev.city || user.city || "",
      }));
    }
  }, [user]);

  // Read the cart state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lemmewear_checkout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items)) {
          // The cart uses 'qty' but the API expects 'quantity'
          const mappedItems = parsed.items.map((i: any) => ({
            ...i,
            quantity: i.qty || i.quantity || 1,
            productId: i.productId || i.id?.toString() || Date.now().toString(),
            slug: i.slug || `custom-item-${i.id || Date.now()}`,
            name: i.name || "Custom Item",
            image: i.image || "/assets/hero-tshirt.jpg",
            color: i.color || "Custom",
            size: i.size || "M",
          }));
          setCartItems(mappedItems);
          setTotals({ subtotal: parsed.subtotal || 0, total: parsed.total || 0 });
        }
      }
    } catch(e) {
      console.error("Failed to parse checkout state", e);
    }
  }, []);

  const nextStep = async () => {
    if (step === 0) {
      const missing = Object.entries(form).find(([, v]) => !v.trim());
      if (missing) { toast.error("Please fill all shipping details"); return; }
    }
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      // Place order via API
      setPlacing(true);
      try {
        const result = await createOrder({
          items: cartItems,
          subtotal: totals.subtotal,
          total: totals.total,
          shipping: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          payment: {
            method: payMethod,
          },
        });

        // Store order number for confirmation page
        const orderData = result.data as { orderNumber?: string };
        if (orderData?.orderNumber) {
          sessionStorage.setItem("lastOrderNumber", orderData.orderNumber);
        }

        toast.success("Order placed successfully!");
        router.push('/order-confirmation');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to place order";
        toast.error(message);
      } finally {
        setPlacing(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1 container py-12 max-w-5xl">
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
          {/* Main form area */}
          <div>
            {/* Step 0: Shipping */}
            {step === 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-bold font-sans text-lg">Shipping Address</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Full Name</Label><Input value={form.fullName} onChange={set("fullName")} placeholder="Rahul Sharma" className="mt-1.5" /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} placeholder="rahul@email.com" className="mt-1.5" /></div>
                  <div><Label>Phone</Label><Input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 99999 99999" className="mt-1.5" /></div>
                  <div className="sm:col-span-2"><Label>Full Address</Label><Input value={form.address} onChange={set("address")} placeholder="House no., Street, Area" className="mt-1.5" /></div>
                  <div><Label>City</Label><Input value={form.city} onChange={set("city")} placeholder="Mumbai" className="mt-1.5" /></div>
                  <div><Label>State</Label><Input value={form.state} onChange={set("state")} placeholder="Maharashtra" className="mt-1.5" /></div>
                  <div><Label>Pincode</Label><Input value={form.pincode} onChange={set("pincode")} placeholder="400001" className="mt-1.5" /></div>
                </div>
              </div>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-bold font-sans text-lg">Payment Method</h2>
                </div>
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-smooth ${
                      payMethod === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
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

                {payMethod === "upi" && (
                  <div className="mt-2">
                    <Label>UPI ID</Label>
                    <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@upi" className="mt-1.5" />
                  </div>
                )}
                {payMethod === "card" && (
                  <div className="space-y-3 mt-2">
                    <div><Label>Card Number</Label><Input placeholder="0000 0000 0000 0000" className="mt-1.5 font-mono" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Expiry</Label><Input placeholder="MM / YY" className="mt-1.5 font-mono" /></div>
                      <div><Label>CVV</Label><Input placeholder="•••" className="mt-1.5 font-mono" /></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-5">
                <h2 className="font-bold font-sans text-lg">Review Your Order</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[200px]">{form.address}, {form.city} – {form.pincode}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium capitalize">{payMethod.replace("cod", "Cash on Delivery").replace("netbanking", "Net Banking")}</span></div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Your payment info is encrypted and secure. We never store card details.
                </div>
              </div>
            )}

            <Button variant="hero" size="lg" className="w-full mt-5" onClick={nextStep} disabled={placing}>
              {placing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Placing Order...</> : step === 2 ? "Place Order" : "Continue →"}
            </Button>
            {step > 0 && (
              <Button variant="outline" size="lg" className="w-full mt-2" onClick={() => setStep((s) => s - 1)}>
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
                  <span className="text-muted-foreground">{item.name} {item.size && `(${item.size})`} {item.quantity > 1 && `x${item.quantity}`}</span>
                  <span>₹{item.price.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-primary">Free</span></div>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="gradient-text text-lg">₹{totals.total.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-xs text-muted-foreground">Estimated delivery: 5–7 business days</p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
