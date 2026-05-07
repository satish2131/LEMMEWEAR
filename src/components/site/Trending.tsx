"use client";
import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { readActiveCart, writeActiveCart } from "@/lib/cartKey";

interface TrendingProduct {
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  rating: number;
  image: string;
  badge?: string;
}

const fallbackProducts: TrendingProduct[] = [
  { name: "Aurora Tee", subtitle: "Lavender Mist", price: 1499, rating: 4.9, image: "/assets/tshirt-aurora.jpg", slug: "aurora-tee", badge: "Bestseller" },
  { name: "Noctura Crew", subtitle: "Deep Plum", price: 1799, rating: 4.8, image: "/assets/tshirt-noctura.jpg", slug: "noctura-crew", badge: "Sale" },
  { name: "Solstice Oversized", subtitle: "Soft White", price: 1899, rating: 4.9, image: "/assets/tshirt-solstice.jpg", slug: "solstice-oversized-men" },
  { name: "Horizon Classic", subtitle: "Royal Purple", price: 1599, rating: 4.7, image: "/assets/tshirt-horizon.jpg", slug: "horizon-classic" },
];

export const Trending = () => {
  const [products, setProducts] = useState<TrendingProduct[]>(fallbackProducts);
  const [sectionTitle, setSectionTitle] = useState("Trending Now");
  const [sectionSubtitle, setSectionSubtitle] = useState("Bestsellers");

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Fetch site settings to get pinned slugs + display count
        const settingsRes = await fetch("/api/site/settings");
        const settingsJson = await settingsRes.json();

        let displayCount = 4;
        let pinnedSlugs: string[] = [];

        if (settingsJson.success && settingsJson.data?.trending) {
          const t = settingsJson.data.trending;
          if (t.sectionTitle) setSectionTitle(t.sectionTitle);
          if (t.sectionSubtitle) setSectionSubtitle(t.sectionSubtitle);
          displayCount = t.displayCount ?? 4;
          pinnedSlugs = (t.productSlugs ?? []).filter(Boolean);
        }

        if (pinnedSlugs.length > 0) {
          // 2a. Manual mode — fetch each pinned product by slug in order
          const results = await Promise.all(
            pinnedSlugs.slice(0, displayCount).map((slug) =>
              fetch(`/api/products/${slug}`)
                .then((r) => r.json())
                .then((j) => (j.success ? j.data : null))
                .catch(() => null)
            )
          );
          const valid = results.filter(Boolean) as TrendingProduct[];
          if (valid.length > 0) {
            setProducts(valid);
            return;
          }
        }

        // 2b. Auto mode — fetch top-rated products
        const autoRes = await fetch(`/api/products/trending?limit=${displayCount}`);
        const autoJson = await autoRes.json();
        if (autoJson.success && autoJson.data?.length > 0) {
          setProducts(autoJson.data);
        }
      } catch {
        // keep fallback
      }
    };

    load();
  }, []);

  return (
    <section className="container py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-sm font-medium text-primary mb-2">{sectionSubtitle}</p>
          <h2 className="text-4xl lg:text-5xl font-bold">{sectionTitle}</h2>
        </div>
        <Link
          href="/shop/men"
          className="text-sm font-medium text-primary hover:underline hidden md:inline-block"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((p, i) => (
          <article key={`${p.slug}-${i}`} className="group">
            <Link href={`/product/${p.slug}`}>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 shadow-soft transition-smooth group-hover:shadow-card bg-muted">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-smooth group-hover:scale-105"
                />
                {p.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide shadow-glow">
                    {p.badge}
                  </span>
                )}
                <button
                  aria-label="Wishlist"
                  className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background transition-smooth"
                  onClick={(e) => e.preventDefault()}
                >
                  <Heart className="h-4 w-4" />
                </button>
                <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-smooth">
                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      try {
                        const cart = readActiveCart();
                        cart.push({
                          id: Date.now() + Math.random(),
                          name: p.name,
                          slug: p.slug,
                          color: p.subtitle || "Standard",
                          size: "M",
                          price: p.price,
                          qty: 1,
                          image: p.image,
                        });
                        writeActiveCart(cart);
                      } catch (_) {}
                      toast.success(`${p.name} added to cart`);
                    }}
                  >
                    Quick Add
                  </Button>
                </div>
              </div>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm font-sans">{p.name}</h3>
                {p.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {p.rating}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{p.subtitle}</p>
              <p className="text-base font-bold">₹{p.price.toLocaleString("en-IN")}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
