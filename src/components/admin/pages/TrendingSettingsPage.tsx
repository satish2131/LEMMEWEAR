"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Loader2, Save, TrendingUp, Search, X, GripVertical,
  Plus, Star, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAdminSettings } from "@/lib/useAdminSettings";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  category: string;
  rating: number;
  badge?: string;
  inStock: boolean;
}

// ─── Sortable Item ────────────────────────────────────────────────────────────

function SortableProduct({
  product,
  index,
  onRemove,
}: {
  product: Product;
  index: number;
  onRemove: (slug: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow ${
        isDragging ? "shadow-xl border-primary/50" : "border-border hover:border-primary/30"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Position badge */}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
        {index + 1}
      </span>

      {/* Image */}
      <img
        src={product.image}
        alt={product.name}
        className="h-12 w-12 rounded-lg object-cover bg-muted shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0">
            {product.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              {product.rating}
            </span>
          )}
          {product.badge && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {product.badge}
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{product.slug}</p>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(product.slug)}
        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrendingSettingsPage() {
  const { settings, setSettings, loading, saving, save } = useAdminSettings();

  // All products from DB
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Selected products (ordered)
  const [selected, setSelected] = useState<Product[]>([]);

  // Search / picker state
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Display count
  const [displayCount, setDisplayCount] = useState(4);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch all products
  useEffect(() => {
    fetch("/api/admin/products?limit=200")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAllProducts(json.data);
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  // Sync selected from settings once both are loaded
  useEffect(() => {
    if (!loading && allProducts.length > 0) {
      const slugs = settings.trending.productSlugs ?? [];
      const dc = settings.trending.displayCount ?? 4;
      setDisplayCount(dc);

      if (slugs.length > 0) {
        // Preserve order from slugs
        const ordered = slugs
          .map((s) => allProducts.find((p) => p.slug === s))
          .filter(Boolean) as Product[];
        setSelected(ordered);
      }
    }
  }, [loading, allProducts, settings.trending]);

  // Filtered products for picker (exclude already selected)
  const filtered = allProducts.filter((p) => {
    const alreadySelected = selected.some((s) => s.slug === p.slug);
    if (alreadySelected) return false;
    if (!search) return true;
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  const addProduct = (p: Product) => {
    setSelected((prev) => [...prev, p]);
    setSearch("");
  };

  const removeProduct = (slug: string) => {
    setSelected((prev) => prev.filter((p) => p.slug !== slug));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelected((items) => {
        const oldIndex = items.findIndex((i) => i.slug === active.id);
        const newIndex = items.findIndex((i) => i.slug === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    const patch = {
      trending: {
        ...settings.trending,
        productSlugs: selected.map((p) => p.slug),
        displayCount,
      },
    };
    setSettings((prev) => ({ ...prev, ...patch }));
    save(patch);
  };

  const setTrending = (k: string, v: unknown) =>
    setSettings((p) => ({ ...p, trending: { ...p.trending, [k]: v } }));

  if (loading || loadingProducts) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAutoMode = selected.length === 0;
  const previewProducts = isAutoMode
    ? allProducts.slice(0, displayCount)
    : selected.slice(0, displayCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trending Section</h1>
          <p className="text-sm text-muted-foreground">
            Pick products, set order by dragging, and control how many are shown
          </p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* Section text + display count */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <Label>Section Title</Label>
            <Input
              value={settings.trending.sectionTitle}
              onChange={(e) => setTrending("sectionTitle", e.target.value)}
              placeholder="Trending Now"
            />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <Label>Section Subtitle</Label>
            <Input
              value={settings.trending.sectionSubtitle}
              onChange={(e) => setTrending("sectionSubtitle", e.target.value)}
              placeholder="Our most-loved pieces this season"
            />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <Label>Products to Display</Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDisplayCount((n) => Math.max(1, n - 1))}
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center text-2xl font-bold">{displayCount}</span>
              <button
                onClick={() => setDisplayCount((n) => Math.min(selected.length || 20, n + 1))}
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {isAutoMode ? "from auto-selected" : `of ${selected.length} pinned`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mode banner */}
      <div className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium ${
        isAutoMode
          ? "bg-muted text-muted-foreground"
          : "bg-primary/10 text-primary border border-primary/20"
      }`}>
        <TrendingUp className="h-4 w-4 shrink-0" />
        {isAutoMode
          ? `Auto mode — showing top ${displayCount} products by rating from your database`
          : `Manual mode — showing first ${displayCount} of ${selected.length} pinned product(s) in your chosen order`}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Selected products with drag */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Pinned Products
                {selected.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{selected.length}</Badge>
                )}
              </CardTitle>
              {selected.length > 0 && (
                <button
                  onClick={() => setSelected([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.length === 0
                ? "No products pinned — auto mode is active"
                : "Drag rows to reorder. Top items show first."}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {selected.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border rounded-xl">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No products pinned yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Search and add products from the right panel
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selected.map((p) => p.slug)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {selected.map((p, i) => (
                      <SortableProduct
                        key={p.slug}
                        product={p}
                        index={i}
                        onRemove={removeProduct}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Right: Product picker */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Add Products
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Search and click to add products to the trending section
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or category..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Product list */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {search ? "No products match your search" : "All products are already pinned"}
                </div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => addProduct(p)}
                    className="w-full flex items-center gap-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 p-2.5 text-left transition-colors group"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] capitalize px-1 py-0">
                          {p.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        {p.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                            <Star className="h-3 w-3 fill-current" />
                            {p.rating}
                          </span>
                        )}
                        {p.badge && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-7 w-7 rounded-full border-2 border-border group-hover:border-primary group-hover:bg-primary flex items-center justify-center transition-colors shrink-0">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Live Preview — first {displayCount} product(s) shown on homepage
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAutoMode ? "Auto mode preview (top-rated products)" : "Manual selection preview"}
          </p>
        </CardHeader>
        <CardContent>
          {previewProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No products to preview
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {previewProducts.map((p, i) => (
                <div key={p.slug} className="flex flex-col gap-1.5">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {p.badge && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
