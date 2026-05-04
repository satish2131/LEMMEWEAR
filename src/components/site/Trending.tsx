"use client";
import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { fetchTrendingProducts } from "@/lib/api";

interface TrendingProduct {
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  rating: number;
  image: string;
  badge?: string;
}

// Fallback data if API is unavailable
const fallbackProducts: TrendingProduct[] = [
  { name: "Aurora Tee", subtitle: "Lavender Mist", price: 1499, rating: 4.9, image: "/assets/tshirt-aurora.jpg", slug: "aurora-tee", badge: "Bestseller" },
  { name: "Noctura Crew", subtitle: "Deep Plum", price: 1799, rating: 4.8, image: "/assets/tshirt-noctura.jpg", slug: "noctura-crew", badge: "Sale" },
  { name: "Solstice Oversized", subtitle: "Soft White", price: 1899, rating: 4.9, image: "/assets/tshirt-solstice.jpg", slug: "solstice-oversized-men" },
  { name: "Horizon Classic", subtitle: "Royal Purple", price: 1599, rating: 4.7, image: "/assets/tshirt-horizon.jpg", slug: "horizon-classic" },
];

export const Trending = () => {
  const [products, setProducts] = useState<TrendingProduct[]>(fallbackProducts);

  useEffect(() => {
    fetchTrendingProducts(4)
      .then((res) => {
        const data = res.data as TrendingProduct[];
        if (data && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {
        // Keep fallback data
      });
  }, []);

  return (
    <section className="container py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-sm font-medium text-primary mb-2">Bestsellers</p>
          <h2 className="text-4xl lg:text-5xl font-bold">Trending Now</h2>
        </div>
        <Link href="/shop/men" className="text-sm font-medium text-primary hover:underline hidden md:inline-block">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {products.map((p, i) => (
          <article key={i} className="group">
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
                  <Button variant="hero" size="sm" className="w-full" onClick={(e) => e.preventDefault()}>
                    Quick Add
                  </Button>
                </div>
              </div>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm font-sans">{p.name}</h3>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-primary text-primary" />{p.rating}
                </span>
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
