"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin, ChevronLeft, Plus, Trash2, Loader2, Pencil, Check, X, Star
} from "lucide-react";
import { fetchAddresses, addAddress, deleteAddress, updateAddress } from "@/lib/api";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";

interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const EMPTY_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

const USER_EMAIL = "guest@lemmewear.com";

function AddressesContent() {
  const { user } = useAuth();
  const userEmail = user?.email || "";
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Addresses — LemmeWear";
    if (!userEmail) return;
    loadAddresses();
  }, [userEmail]);

  const loadAddresses = () => {
    fetchAddresses(userEmail)
      .then((res) => setAddresses((res.data || []) as Address[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (addr: Address) => {
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setEditingId(addr._id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      let res;
      if (editingId) {
        res = await updateAddress(userEmail, editingId, form);
        toast.success("Address updated");
      } else {
        res = await addAddress(userEmail, form);
        toast.success("Address added");
      }
      setAddresses((res.data || []) as Address[]);
      resetForm();
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteAddress(userEmail, id);
      setAddresses((res.data || []) as Address[]);
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await updateAddress(userEmail, id, { isDefault: true });
      setAddresses((res.data || []) as Address[]);
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default address");
    }
  };

  const labelOptions = ["Home", "Work", "Other"];

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-primary grid place-items-center shadow-glow">
                  <MapPin className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold">Addresses</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {loading ? "Loading..." : `${addresses.length} saved address${addresses.length !== 1 ? "es" : ""}`}
                  </p>
                </div>
              </div>
              {!showForm && (
                <Button
                  variant="hero"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { resetForm(); setShowForm(true); }}
                >
                  <Plus className="h-4 w-4" /> Add Address
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="container py-10 max-w-3xl">
          {/* Add/Edit Form */}
          {showForm && (
            <form
              onSubmit={handleSave}
              className="rounded-2xl border border-primary/20 bg-card p-6 shadow-soft mb-8 space-y-4 animate-fade-up"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold font-sans text-lg">
                  {editingId ? "Edit Address" : "Add New Address"}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Label selector */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Address Type
                </Label>
                <div className="flex gap-2">
                  {labelOptions.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, label: l }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-smooth ${
                        form.label === l
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={form.fullName} onChange={set("fullName")} placeholder="Rahul Sharma" className="mt-1.5" />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 99999 99999" className="mt-1.5" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Street Address *</Label>
                  <Input value={form.address} onChange={set("address")} placeholder="House no., Street, Area" className="mt-1.5" />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={form.city} onChange={set("city")} placeholder="Mumbai" className="mt-1.5" />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input value={form.state} onChange={set("state")} placeholder="Maharashtra" className="mt-1.5" />
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input value={form.pincode} onChange={set("pincode")} placeholder="400001" className="mt-1.5" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
                <label htmlFor="isDefault" className="text-sm cursor-pointer">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="hero" disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? "Update Address" : "Save Address"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Address list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : addresses.length === 0 && !showForm ? (
            <div className="rounded-3xl border border-border bg-card p-16 text-center shadow-soft">
              <div className="h-20 w-20 rounded-full bg-secondary mx-auto grid place-items-center mb-5">
                <MapPin className="h-9 w-9 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No saved addresses</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add your shipping addresses for faster checkout.
              </p>
              <Button
                variant="hero"
                size="lg"
                onClick={() => { resetForm(); setShowForm(true); }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`rounded-2xl border bg-card p-5 shadow-soft transition-smooth hover:shadow-card ${
                    addr.isDefault ? "border-primary/30 bg-primary/[0.02]" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${
                        addr.isDefault ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold font-sans">{addr.fullName}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                              <Star className="h-2.5 w-2.5 fill-primary" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{addr.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {addr.city}, {addr.state} – {addr.pincode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">📞 {addr.phone}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!addr.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-primary"
                          onClick={() => handleSetDefault(addr._id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(addr)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(addr._id)}
                        disabled={deletingId === addr._id}
                      >
                        {deletingId === addr._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <AuthGuard>
      <AddressesContent />
    </AuthGuard>
  );
}
