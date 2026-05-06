"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Tag, Loader2, Search, RefreshCw,
  Copy, ToggleLeft, ToggleRight, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

// ─── Random code generator ────────────────────────────────────────────────────
function generateCode(prefix = "LW") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}${rand}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [fCode, setFCode] = useState("");
  const [fType, setFType] = useState<"percentage" | "fixed">("percentage");
  const [fValue, setFValue] = useState("");
  const [fMin, setFMin] = useState("");
  const [fMaxUses, setFMaxUses] = useState("");
  const [fExpiry, setFExpiry] = useState("");
  const [fDesc, setFDesc] = useState("");

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/coupons?${params}`);
      const json = await res.json();
      if (json.success) setCoupons(json.data);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCoupons, 300);
    return () => clearTimeout(t);
  }, [fetchCoupons]);

  const resetForm = () => {
    setFCode("");
    setFType("percentage");
    setFValue("");
    setFMin("");
    setFMaxUses("");
    setFExpiry("");
    setFDesc("");
  };

  const openCreate = () => {
    resetForm();
    setFCode(generateCode());
    setOpen(true);
  };

  const handleSave = async () => {
    if (!fCode || !fValue) {
      toast.error("Code and value are required");
      return;
    }
    if (fType === "percentage" && (Number(fValue) < 1 || Number(fValue) > 100)) {
      toast.error("Percentage must be between 1 and 100");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fCode,
          type: fType,
          value: Number(fValue),
          minOrderValue: Number(fMin) || 0,
          maxUses: Number(fMaxUses) || 0,
          expiresAt: fExpiry || undefined,
          description: fDesc || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Coupon ${json.data.code} created`);
        setOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        toast.error(json.error || "Failed to create coupon");
      }
    } catch {
      toast.error("Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${c._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) =>
          prev.map((x) => (x._id === c._id ? { ...x, isActive: !x.isActive } : x))
        );
        toast.success(`Coupon ${c.isActive ? "deactivated" : "activated"}`);
      }
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        toast.success("Coupon deleted");
      }
    } catch {
      toast.error("Failed to delete coupon");
    }
    setDeleteId(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  // Stats
  const active = coupons.filter((c) => c.isActive).length;
  const totalUses = coupons.reduce((s, c) => s + c.usedCount, 0);
  const expired = coupons.filter(
    (c) => c.expiresAt && new Date(c.expiresAt) < new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discount Codes</h1>
          <p className="text-sm text-muted-foreground">Create and manage coupon codes</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <Tag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{active}</p>
              <p className="text-xs text-muted-foreground">Active Coupons</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUses}</p>
              <p className="text-xs text-muted-foreground">Total Uses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <RefreshCw className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expired}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">All Coupons</CardTitle>
            <div className="relative sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search codes..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-16 text-center">
              <Tag className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No coupons yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;New Coupon&quot; to create your first discount code
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Discount</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Min Order</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Uses</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">Expires</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => {
                    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                    const isMaxed = c.maxUses > 0 && c.usedCount >= c.maxUses;
                    return (
                      <tr
                        key={c._id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30"
                      >
                        {/* Code */}
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold tracking-wider text-primary">
                              {c.code}
                            </span>
                            <button
                              onClick={() => copyCode(c.code)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy code"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {c.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                          )}
                        </td>

                        {/* Discount */}
                        <td className="py-3">
                          <Badge
                            variant="secondary"
                            className="text-[11px] bg-primary/10 text-primary font-semibold"
                          >
                            {c.type === "percentage"
                              ? `${c.value}% OFF`
                              : `₹${c.value} OFF`}
                          </Badge>
                        </td>

                        {/* Min order */}
                        <td className="py-3 hidden sm:table-cell text-muted-foreground">
                          {c.minOrderValue > 0
                            ? `₹${c.minOrderValue.toLocaleString("en-IN")}`
                            : "—"}
                        </td>

                        {/* Uses */}
                        <td className="py-3 hidden md:table-cell">
                          <span className={isMaxed ? "text-red-500 font-medium" : ""}>
                            {c.usedCount}
                            {c.maxUses > 0 && ` / ${c.maxUses}`}
                          </span>
                        </td>

                        {/* Expires */}
                        <td className="py-3 hidden lg:table-cell">
                          {c.expiresAt ? (
                            <span className={isExpired ? "text-red-500" : "text-muted-foreground"}>
                              {new Date(c.expiresAt).toLocaleDateString("en-IN")}
                              {isExpired && " (expired)"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={c.isActive && !isExpired && !isMaxed}
                              onCheckedChange={() => toggleActive(c)}
                              disabled={!!isExpired || !!isMaxed}
                            />
                            <span className="text-xs text-muted-foreground">
                              {isExpired
                                ? "Expired"
                                : isMaxed
                                ? "Maxed"
                                : c.isActive
                                ? "Active"
                                : "Off"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(c._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Discount Code</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Code */}
            <div>
              <Label>Coupon Code *</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="e.g. SUMMER20"
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value.toUpperCase())}
                  className="font-mono font-bold tracking-wider"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setFCode(generateCode())}
                  title="Generate random code"
                  className="shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type *</Label>
                <Select value={fType} onValueChange={(v) => setFType(v as "percentage" | "fixed")}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {fType === "percentage" ? "Discount %" : "Discount ₹"} *
                </Label>
                <Input
                  type="number"
                  placeholder={fType === "percentage" ? "10" : "100"}
                  className="mt-1.5"
                  value={fValue}
                  onChange={(e) => setFValue(e.target.value)}
                  min={1}
                  max={fType === "percentage" ? 100 : undefined}
                />
              </div>
            </div>

            {/* Preview */}
            {fCode && fValue && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-primary tracking-wider">{fCode}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fType === "percentage"
                      ? `${fValue}% off your order`
                      : `₹${fValue} off your order`}
                    {fMin ? ` on orders above ₹${fMin}` : ""}
                  </p>
                </div>
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {fType === "percentage" ? `${fValue}% OFF` : `₹${fValue} OFF`}
                </Badge>
              </div>
            )}

            {/* Min order */}
            <div>
              <Label>
                Minimum Order Value (₹){" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="number"
                placeholder="0 = no minimum"
                className="mt-1.5"
                value={fMin}
                onChange={(e) => setFMin(e.target.value)}
              />
            </div>

            {/* Max uses + Expiry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Max Uses{" "}
                  <span className="text-muted-foreground font-normal">(0 = unlimited)</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="mt-1.5"
                  value={fMaxUses}
                  onChange={(e) => setFMaxUses(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Expiry Date{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={fExpiry}
                  onChange={(e) => setFExpiry(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. Summer sale 2026"
                className="mt-1.5"
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
              />
            </div>

            <Button className="w-full rounded-xl mt-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                "Create Coupon"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This coupon will be permanently deleted and can no longer be used at checkout.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
