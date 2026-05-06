"use client";
import { useState, useEffect, useRef } from "react";
import {
  Loader2, Save, Plus, Trash2, Shirt, Package,
  ImagePlus, X, Upload, Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GiftItem {
  id: string;
  name: string;
  color?: string;
  desc?: string;
  price: number;
  image: string;
}

interface GiftBuilder {
  tshirts: GiftItem[];
  accessories: GiftItem[];
  chocolates: GiftItem[];
  packagings: GiftItem[];
}

type Category = keyof GiftBuilder;

const CATEGORY_META: Record<Category, { label: string; icon: typeof Shirt; colorField: boolean; descField: boolean; priceLabel: string }> = {
  tshirts: { label: "T-Shirts", icon: Shirt, colorField: true, descField: false, priceLabel: "Price (₹)" },
  accessories: { label: "Accessories", icon: Package, colorField: false, descField: false, priceLabel: "Add-on Price (₹)" },
  chocolates: { label: "Chocolates", icon: Package, colorField: false, descField: false, priceLabel: "Add-on Price (₹)" },
  packagings: { label: "Packaging", icon: Package, colorField: false, descField: true, priceLabel: "Add-on Price (₹)" },
};

const DEFAULT_BUILDER: GiftBuilder = {
  tshirts: [
    { id: "t1", name: "Abstract Aurora", color: "Multicolor Print", price: 1499, image: "/tshirts/abstract.png" },
    { id: "t2", name: "Vintage Wash", color: "Faded Black", price: 1799, image: "/tshirts/vintage.png" },
    { id: "t3", name: "Tokyo Streetwear", color: "White Graphic", price: 1599, image: "/tshirts/streetwear.png" },
    { id: "t4", name: "Classic Blank", color: "Soft White", price: 999, image: "/tshirts/blank-tshirt.png" },
    { id: "t5", name: "Meme Core", color: "Funny Graphic", price: 1299, image: "/tshirts/meme.png" },
  ],
  accessories: [
    { id: "a1", name: "Lume Bifold Wallet", price: 499, image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400" },
    { id: "a2", name: "Embroidered Cap", price: 299, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400" },
    { id: "a3", name: "Leather Keychain", price: 199, image: "https://images.unsplash.com/photo-1584984647265-4f40fbb1010e?auto=format&fit=crop&q=80&w=400" },
  ],
  chocolates: [
    { id: "c1", name: "Belgian Dark Box", price: 299, image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=400" },
    { id: "c2", name: "Assorted Pralines", price: 399, image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&q=80&w=400" },
    { id: "c3", name: "Hazelnut Truffles", price: 449, image: "https://images.unsplash.com/photo-1614088058869-7c1b827e80f2?auto=format&fit=crop&q=80&w=400" },
  ],
  packagings: [
    { id: "p1", name: "Kraft Paper Bag", desc: "Eco-friendly paper bag", price: 0, image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&q=80&w=400" },
    { id: "p2", name: "Premium Gift Box", desc: "Rigid box with ribbon & tissue", price: 149, image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&q=80&w=400" },
    { id: "p3", name: "Luxury Velvet Box", desc: "Premium box with velvet lining", price: 299, image: "https://images.unsplash.com/photo-1550983556-9a286c07abaf?auto=format&fit=crop&q=80&w=400" },
  ],
};

// ─── Image Uploader ───────────────────────────────────────────────────────────

function ImageUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL("image/jpeg", 0.82));
        setProcessing(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex rounded-md border border-border overflow-hidden text-xs font-medium">
        <button type="button" onClick={() => setTab("upload")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors",
            tab === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
          <Upload className="h-3 w-3" /> Upload
        </button>
        <button type="button" onClick={() => setTab("url")}
          className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors",
            tab === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
          <LinkIcon className="h-3 w-3" /> URL
        </button>
      </div>

      {tab === "upload" ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
          className={cn(
            "relative flex items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors overflow-hidden",
            value ? "h-24" : "h-20",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : value ? (
            <>
              <img src={value} alt="preview" className="h-full w-full object-cover" />
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                Click to change
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px]">Click or drag & drop</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <Input placeholder="https://..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && urlInput.trim()) { onChange(urlInput.trim()); setUrlInput(""); } }}
              className="h-7 text-xs flex-1" />
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2"
              onClick={() => { if (urlInput.trim()) { onChange(urlInput.trim()); setUrlInput(""); } }}>
              Apply
            </Button>
          </div>
          {value && (
            <div className="relative h-16 w-16">
              <img src={value} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-border" />
              <button type="button" onClick={() => onChange("")}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({
  item, index, category, onUpdate, onRemove,
}: {
  item: GiftItem;
  index: number;
  category: Category;
  onUpdate: (i: number, k: keyof GiftItem, v: string | number) => void;
  onRemove: (i: number) => void;
}) {
  const meta = CATEGORY_META[category];

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Item {index + 1}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => onRemove(index)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Image */}
        <div>
          <Label className="text-xs">Image</Label>
          <div className="mt-1">
            <ImageUploader value={item.image} onChange={(v) => onUpdate(index, "image", v)} />
          </div>
        </div>

        {/* Name */}
        <div>
          <Label className="text-xs">Name</Label>
          <Input className="mt-1 h-7 text-xs" value={item.name}
            onChange={(e) => onUpdate(index, "name", e.target.value)} placeholder="Item name" />
        </div>

        {/* Color (tshirts only) */}
        {meta.colorField && (
          <div>
            <Label className="text-xs">Color / Style</Label>
            <Input className="mt-1 h-7 text-xs" value={item.color || ""}
              onChange={(e) => onUpdate(index, "color", e.target.value)} placeholder="e.g. Faded Black" />
          </div>
        )}

        {/* Desc (packaging) */}
        {meta.descField && (
          <div>
            <Label className="text-xs">Description</Label>
            <Input className="mt-1 h-7 text-xs" value={item.desc || ""}
              onChange={(e) => onUpdate(index, "desc", e.target.value)} placeholder="e.g. Rigid box with ribbon" />
          </div>
        )}

        {/* Price */}
        <div>
          <Label className="text-xs">{meta.priceLabel}</Label>
          <Input type="number" className="mt-1 h-7 text-xs" value={item.price || ""}
            onChange={(e) => onUpdate(index, "price", Number(e.target.value))} placeholder="0" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: Category; label: string; emoji: string }[] = [
  { id: "tshirts", label: "T-Shirts", emoji: "👕" },
  { id: "accessories", label: "Accessories", emoji: "👜" },
  { id: "chocolates", label: "Chocolates", emoji: "🍫" },
  { id: "packagings", label: "Packaging", emoji: "📦" },
];

export default function GiftBuilderSettingsPage() {
  const [builder, setBuilder] = useState<GiftBuilder>(DEFAULT_BUILDER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Category>("tshirts");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.giftBuilder) {
          const gb = json.data.giftBuilder;
          setBuilder({
            tshirts: gb.tshirts?.length ? gb.tshirts : DEFAULT_BUILDER.tshirts,
            accessories: gb.accessories?.length ? gb.accessories : DEFAULT_BUILDER.accessories,
            chocolates: gb.chocolates?.length ? gb.chocolates : DEFAULT_BUILDER.chocolates,
            packagings: gb.packagings?.length ? gb.packagings : DEFAULT_BUILDER.packagings,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftBuilder: builder }),
      });
      const json = await res.json();
      if (json.success) toast.success("Gift builder saved");
      else toast.error(json.error || "Failed to save");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (cat: Category, i: number, k: keyof GiftItem, v: string | number) =>
    setBuilder((prev) => {
      const items = [...prev[cat]];
      items[i] = { ...items[i], [k]: v };
      return { ...prev, [cat]: items };
    });

  const removeItem = (cat: Category, i: number) =>
    setBuilder((prev) => ({ ...prev, [cat]: prev[cat].filter((_, idx) => idx !== i) }));

  const addItem = (cat: Category) => {
    const prefix = cat[0];
    const id = `${prefix}${Date.now()}`;
    const newItem: GiftItem = { id, name: "", price: 0, image: "" };
    setBuilder((prev) => ({ ...prev, [cat]: [...prev[cat], newItem] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = builder[activeTab];
  const meta = CATEGORY_META[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gift Box Builder Items</h1>
          <p className="text-sm text-muted-foreground">
            Manage the items customers can choose in each step of the gift box builder
          </p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={save} disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* Step tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              activeTab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <span>{t.emoji}</span>
            <span>Step {i + 1}: {t.label}</span>
            <span className={cn(
              "ml-1 text-xs px-1.5 py-0.5 rounded-full",
              activeTab === t.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {builder[t.id].length}
            </span>
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            {TABS.find((t) => t.id === activeTab)?.emoji} {meta.label}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeTab === "tshirts" && "These t-shirts appear in Step 1 of the gift box builder"}
            {activeTab === "accessories" && "These accessories appear in Step 2 (optional add-ons)"}
            {activeTab === "chocolates" && "These chocolates appear in Step 3 (optional add-ons)"}
            {activeTab === "packagings" && "These packaging options appear in Step 4"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => addItem(activeTab)}>
          <Plus className="h-3.5 w-3.5" /> Add {meta.label.slice(0, -1)}
        </Button>
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-muted-foreground">
          <span className="text-4xl mb-3">{TABS.find((t) => t.id === activeTab)?.emoji}</span>
          <p className="text-sm font-medium">No {meta.label.toLowerCase()} yet</p>
          <Button variant="outline" size="sm" className="gap-2 mt-4" onClick={() => addItem(activeTab)}>
            <Plus className="h-3.5 w-3.5" /> Add First Item
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              index={i}
              category={activeTab}
              onUpdate={(idx, k, v) => updateItem(activeTab, idx, k, v)}
              onRemove={(idx) => removeItem(activeTab, idx)}
            />
          ))}

          {/* Add button */}
          <button
            onClick={() => addItem(activeTab)}
            className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 p-6 text-muted-foreground hover:text-foreground min-h-[200px]"
          >
            <Plus className="h-7 w-7" />
            <span className="text-sm font-medium">Add {meta.label.slice(0, -1)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
