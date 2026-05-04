"use client";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SlidersHorizontal, Ruler, Loader2 } from "lucide-react";
import { Category as Cat, Product, categoryMeta, getProductsByCategory } from "@/data/products";
import { fetchProducts } from "@/lib/api";

interface Props {
  category: Cat;
}

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const STYLE_FILTERS = [
  "Oversized T-Shirts", "Regular Fit T-Shirts", "Relaxed Fit T-Shirts", "Longline T-Shirts",
  "Half Sleeve T-Shirts", "Full Sleeve T-Shirts", "Sleeveless T-Shirts", "Tank Tops",
  "Plain / Solid T-Shirts", "Graphic Print T-Shirts", "Typography T-Shirts (Quotes)",
  "Minimalist T-Shirts", "Anime T-Shirts", "Streetwear Designs", "Vintage / Washed T-Shirts",
  "Aesthetic / Soft-tone T-Shirts", "Abstract Design T-Shirts", "Cartoon / Pop Culture T-Shirts",
  "Logo-Based T-Shirts", "Meme T-Shirts"
];

const CategoryPage = ({ category }: Props) => {
  const meta = categoryMeta[category];
  const fallback = useMemo(() => getProductsByCategory(category), [category]);
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null);
  const [loadingApi, setLoadingApi] = useState(true);

  // Fetch products from database API
  useEffect(() => {
    setLoadingApi(true);
    fetchProducts({ category })
      .then((res) => {
        const data = res.data as (Product & { productId?: string })[];
        if (data && data.length > 0) {
          setApiProducts(data.map((p) => ({ ...p, id: p.productId || p.id })));
        }
      })
      .catch(() => { /* fallback to static data */ })
      .finally(() => setLoadingApi(false));
  }, [category]);

  const all = apiProducts || fallback;

  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)));
    return Array.from(map, ([name, hex]) => ({ name, hex }));
  }, [all]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    all.forEach((p) => p.sizes?.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [all]);

  const maxPrice = useMemo(() => Math.max(...all.map((p) => p.price), 1000), [all]);

  const [sort, setSort] = useState("featured");
  const [price, setPrice] = useState<number[]>([maxPrice]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);

  useEffect(() => {
    document.title = `${meta.title} — LumeWear`;
    const desc = meta.description;
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
    setPrice([maxPrice]);
    setColors([]);
    setSizes([]);
    setStyles([]);
    setSort("featured");
  }, [category, meta.title, meta.description, maxPrice]);

  const filtered = useMemo(() => {
    let list = all.filter((p) => p.price <= price[0]);
    if (colors.length) list = list.filter((p) => p.colors.some((c) => colors.includes(c.name)));
    if (sizes.length) list = list.filter((p) => p.sizes?.some((s) => sizes.includes(s)));
    if (styles.length) list = list.filter((p) => p.styles?.some((s) => styles.includes(s)));
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }, [all, price, colors, sizes, styles, sort]);

  // Single-select: deselect if already chosen, else replace selection
  const selectOne = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? [] : [value]);
  };

  // Multi-select: for categories checkboxes
  const toggle = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const Filters = () => (
    <div className="space-y-8">

      {/* Categories (formerly Style & Fit) — moved to top */}
      {["men", "women", "unisex"].includes(category) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Categories</h4>
          <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {STYLE_FILTERS.map((s) => (
              <div key={s} className="flex items-start space-x-3">
                <Checkbox
                  id={`filter-${s}`}
                  checked={styles.includes(s)}
                  onCheckedChange={() => toggle(styles, setStyles, s)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`filter-${s}`}
                  className="text-sm font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-3">Price</h4>
        <Slider
          value={price}
          onValueChange={setPrice}
          min={500}
          max={maxPrice}
          step={100}
          className="mb-2"
        />
        <p className="text-xs text-muted-foreground">Up to ₹{price[0].toLocaleString("en-IN")}</p>
      </div>

      {allColors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Color</h4>
          <div className="flex flex-wrap gap-2">
            {allColors.map((c) => {
              const active = colors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => selectOne(colors, setColors, c.name)}
                  className={`h-9 px-3 rounded-full border text-xs flex items-center gap-2 transition-smooth ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full border border-border" style={{ background: c.hex }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Size</h4>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-xs font-medium text-primary hover:underline flex items-center gap-1 transition-smooth">
                  <Ruler className="h-3.5 w-3.5" /> Size Chart
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Size Guide</DialogTitle>
                </DialogHeader>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-secondary/50 text-secondary-foreground">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg font-semibold">Size</th>
                        <th className="px-4 py-3 font-semibold">Chest (in)</th>
                        <th className="px-4 py-3 font-semibold">Length (in)</th>
                        <th className="px-4 py-3 rounded-tr-lg font-semibold">Sleeve (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors"><td className="px-4 py-3 font-medium">XS</td><td className="px-4 py-3">36 - 38</td><td className="px-4 py-3">27</td><td className="px-4 py-3">8</td></tr>
                      <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors"><td className="px-4 py-3 font-medium">S</td><td className="px-4 py-3">38 - 40</td><td className="px-4 py-3">28</td><td className="px-4 py-3">8.5</td></tr>
                      <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors"><td className="px-4 py-3 font-medium">M</td><td className="px-4 py-3">40 - 42</td><td className="px-4 py-3">29</td><td className="px-4 py-3">9</td></tr>
                      <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors"><td className="px-4 py-3 font-medium">L</td><td className="px-4 py-3">42 - 44</td><td className="px-4 py-3">30</td><td className="px-4 py-3">9.5</td></tr>
                      <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors"><td className="px-4 py-3 font-medium">XL</td><td className="px-4 py-3">44 - 46</td><td className="px-4 py-3">31</td><td className="px-4 py-3">10</td></tr>
                      <tr className="hover:bg-secondary/20 transition-colors"><td className="px-4 py-3 font-medium">XXL</td><td className="px-4 py-3">46 - 48</td><td className="px-4 py-3">32</td><td className="px-4 py-3">10.5</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Measurements are in inches. Please allow ±0.5" tolerance.</p>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((s) => {
              const active = sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectOne(sizes, setSizes, s)}
                  className={`h-9 min-w-9 px-3 rounded-md border text-xs font-medium transition-smooth ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}


      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setPrice([maxPrice]);
          setColors([]);
          setSizes([]);
          setStyles([]);
          setPrice([maxPrice]);
        }}
      >
        Reset filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1">
        {/* Hero band */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 gradient-hero opacity-40" aria-hidden />
          <div className="container relative py-16 lg:py-24">
            <p className="text-sm font-medium text-primary mb-3">{meta.eyebrow}</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">{meta.title}</h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl">{meta.description}</p>
          </div>
        </section>

        {/* Toolbar */}
        <section className="container py-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> products
            </p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-2">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <Filters />
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
            <aside className="hidden lg:block sticky top-24 self-start">
              <Filters />
            </aside>

            <div>
              {loadingApi ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 border border-dashed rounded-2xl">
                  <p className="text-lg font-semibold mb-2">No products match your filters</p>
                  <p className="text-sm text-muted-foreground mb-6">Try widening your selection.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setColors([]);
                      setSizes([]);
                      setPrice([maxPrice]);
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
