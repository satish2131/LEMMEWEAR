"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Package, Loader2, Upload, X, ImagePlus, Link } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  _id: string;
  productId: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  description: string;
  features: string[];
  colors: { name: string; hex: string }[];
  image: string;
  inStock: boolean;
}

// ─── Image Uploader Component ─────────────────────────────────────────────────

function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [compressing, setCompressing] = useState(false);

  // Compress + convert file to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      // Resize to max 800px using canvas
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        onChange(compressed);
        setCompressing(false);
        toast.success("Image uploaded");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http")) {
      toast.error("Enter a valid URL starting with http");
      return;
    }
    onChange(trimmed);
    toast.success("Image URL applied");
  };

  return (
    <div className="space-y-3">
      <Label>Product Image *</Label>

      {/* Tab switcher */}
      <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors",
            tab === "upload"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Upload className="h-3.5 w-3.5" /> Upload File
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors",
            tab === "url"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Link className="h-3.5 w-3.5" /> Paste URL
        </button>
      </div>

      {tab === "upload" ? (
        /* Drag & Drop Zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors select-none",
            value ? "h-36" : "h-36",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {compressing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Processing image...</p>
            </div>
          ) : value ? (
            /* Preview with remove button */
            <>
              <img
                src={value}
                alt="Preview"
                className="h-full w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] text-white whitespace-nowrap">
                Click to change
              </div>
            </>
          ) : (
            /* Empty state */
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {dragging ? "Drop image here" : "Click or drag & drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PNG, JPG, WEBP up to 10 MB
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* URL Input */
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyUrl()}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={applyUrl} className="shrink-0">
              Apply
            </Button>
          </div>
          {value && (
            <div className="relative h-28 w-28">
              <img
                src={value}
                alt="Preview"
                className="h-28 w-28 rounded-lg object-cover border border-border"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  toast.error("Could not load image from URL");
                }}
              />
              <button
                type="button"
                onClick={() => { onChange(""); setUrlInput(""); }}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOldPrice, setFormOldPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFeatures, setFormFeatures] = useState("");
  const [formColors, setFormColors] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products?limit=100");
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setFormName("");
    setFormCategory("");
    setFormPrice("");
    setFormOldPrice("");
    setFormDescription("");
    setFormFeatures("");
    setFormColors("");
    setFormImage("");
    setFormSubtitle("");
    setEditingProduct(null);
  };

  const openAddDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(String(p.price));
    setFormOldPrice(p.oldPrice ? String(p.oldPrice) : "");
    setFormDescription(p.description);
    setFormFeatures(p.features.join(", "));
    setFormColors(p.colors.map((c) => c.hex).join(", "));
    setFormImage(p.image);
    setFormSubtitle("");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formCategory || !formPrice || !formDescription) {
      toast.error("Please fill in name, category, price and description");
      return;
    }
    if (!formImage) {
      toast.error("Please add a product image");
      return;
    }

    setSaving(true);
    try {
      const colorHexes = formColors.split(",").map((c) => c.trim()).filter(Boolean);

      const payload = {
        name: formName,
        category: formCategory,
        subtitle: formSubtitle || formName,
        price: Number(formPrice),
        oldPrice: formOldPrice ? Number(formOldPrice) : undefined,
        description: formDescription,
        features: formFeatures.split(",").map((f) => f.trim()).filter(Boolean),
        colors: colorHexes.map((hex) => ({ name: hex, hex })),
        image: formImage,
        inStock: true,
      };

      let res: Response;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        toast.success(editingProduct ? "Product updated" : "Product added");
        setOpen(false);
        resetForm();
        fetchProducts();
      } else {
        toast.error(json.error || "Failed to save product");
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setProducts((prev) => prev.filter((p) => p.productId !== productId));
        toast.success("Product deleted");
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete product");
    }
    setDeleteConfirm(null);
  };

  const toggleStock = async (p: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${p.productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: !p.inStock }),
      });
      const json = await res.json();
      if (json.success) {
        setProducts((prev) =>
          prev.map((prod) =>
            prod.productId === p.productId ? { ...prod, inStock: !prod.inStock } : prod
          )
        );
      }
    } catch {
      toast.error("Failed to update stock");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your store inventory</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={openAddDialog}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Image Uploader */}
            <ImageUploader value={formImage} onChange={setFormImage} />

            {/* Name */}
            <div>
              <Label>Name *</Label>
              <Input
                placeholder="Product name"
                className="mt-1.5"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Subtitle */}
            <div>
              <Label>Subtitle</Label>
              <Input
                placeholder="Short tagline"
                className="mt-1.5"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
              />
            </div>

            {/* Category + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  placeholder="999"
                  className="mt-1.5"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Old Price */}
            <div>
              <Label>Old Price (₹) <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="number"
                placeholder="1299"
                className="mt-1.5"
                value={formOldPrice}
                onChange={(e) => setFormOldPrice(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Product description..."
                className="mt-1.5 min-h-[80px]"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Features */}
            <div>
              <Label>Features <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input
                placeholder="100% Cotton, Pre-shrunk, Double-stitched"
                className="mt-1.5"
                value={formFeatures}
                onChange={(e) => setFormFeatures(e.target.value)}
              />
            </div>

            {/* Colors */}
            <div>
              <Label>Color Hex Codes <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input
                placeholder="#1a1a2e, #f5f5f5, #2d6a4f"
                className="mt-1.5"
                value={formColors}
                onChange={(e) => setFormColors(e.target.value)}
              />
              {/* Color swatches preview */}
              {formColors && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {formColors
                    .split(",")
                    .map((c) => c.trim())
                    .filter((c) => /^#[0-9a-fA-F]{3,6}$/.test(c))
                    .map((hex) => (
                      <span
                        key={hex}
                        className="h-5 w-5 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <Button className="w-full rounded-xl mt-2" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : editingProduct ? (
                "Update Product"
              ) : (
                "Save Product"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium hidden sm:table-cell">Category</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium hidden md:table-cell">Stock</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Package className="mx-auto h-10 w-10 text-muted-foreground/30" />
                        <p className="mt-3 text-sm text-muted-foreground">No products yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click &quot;Add Product&quot; to get started
                        </p>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p._id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0"
                            />
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.productId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[11px] capitalize">
                            {p.category}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">₹{p.price.toLocaleString()}</span>
                          {p.oldPrice && (
                            <span className="ml-1.5 text-xs text-muted-foreground line-through">
                              ₹{p.oldPrice}
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Switch checked={p.inStock} onCheckedChange={() => toggleStock(p)} />
                            <span className="text-xs text-muted-foreground">
                              {p.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(p.productId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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
    </div>
  );
}
