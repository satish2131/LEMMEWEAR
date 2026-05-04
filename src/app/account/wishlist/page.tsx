"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import {
  Heart, ChevronLeft, ShoppingBag, Star, Trash2, Loader2, ShoppingCart
} from "lucide-react";
import { fetchWishlist, removeFromWishlist } from "@/lib/api";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";

interface WishlistProduct {
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  category: string;
  colors: { name: string; hex: string }[];
}

const USER_EMAIL = "guest@lemmewear.com";

function WishlistContent() {
  const { user } = useAuth();
  const userEmail = user?.email || "";
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Wishlist — LemmeWear";
    if (!userEmail) return;
    fetchWishlist(userEmail)
      .then((res) => setProducts((res.data || []) as WishlistProduct[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userEmail]);

  const handleRemove = async (slug: string) => {
    setRemoving(slug);
    try {
      await removeFromWishlist(userEmail, slug);
      setProducts((prev) => prev.filter((p) => p.slug !== slug));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemoving(null);
    }
  };

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
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl gradient-primary grid place-items-center shadow-glow">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">Wishlist</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {loading ? "Loading..." : `${products.length} saved item${products.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-10 max-w-5xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-16 text-center shadow-soft">
              <div className="h-20 w-20 rounded-full bg-secondary mx-auto grid place-items-center mb-5">
                <Heart className="h-9 w-9 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Browse our collection and tap the heart icon to save items you love.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link href="/shop/men">Explore Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {products.map((p) => (
                <article
                  key={p.slug}
                  className="group rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-smooth hover:shadow-card hover:-translate-y-0.5"
                >
                  <Link href={`/product/${p.slug}`}>
                    <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                      />
                      {p.badge && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide shadow-glow">
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm font-sans">{p.name}</h3>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-primary text-primary" />{p.rating}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-base font-bold">₹{p.price.toLocaleString("en-IN")}</span>
                        {p.oldPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{p.oldPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Color dots */}
                    <div className="flex gap-1.5">
                      {p.colors.slice(0, 4).map((c) => (
                        <span
                          key={c.name}
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ background: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button asChild variant="hero" size="sm" className="flex-1 gap-1.5">
                        <Link href={`/product/${p.slug}`}>
                          <ShoppingCart className="h-3.5 w-3.5" /> View Product
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                        onClick={() => handleRemove(p.slug)}
                        disabled={removing === p.slug}
                      >
                        {removing === p.slug ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}
