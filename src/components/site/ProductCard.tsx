"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/data/products";
import { toast } from "sonner";
import { readActiveCart, writeActiveCart } from "@/lib/cartKey";
import { useAuth } from "@/context/AuthContext";
import { addToWishlist, removeFromWishlist } from "@/lib/api";

interface Props {
  product: Product;
}

export const ProductCard = ({ product: p }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user?.email) {
      toast.error("Please sign in to save items to your wishlist");
      router.push("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await removeFromWishlist(user.email, p.slug);
        setWishlisted(false);
        toast.success(`${p.name} removed from wishlist`);
      } else {
        await addToWishlist(user.email, p.slug);
        setWishlisted(true);
        toast.success(`${p.name} added to wishlist`);
      }
    } catch {
      toast.error("Failed to update wishlist. Please try again.");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <article className="group">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 shadow-soft transition-smooth group-hover:shadow-card bg-muted">
          <img
            src={p.image}
            alt={`${p.name} — ${p.subtitle}`}
            loading="lazy"
            width={640}
            height={800}
            className="absolute inset-0 h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
          {p.badge && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wide uppercase">
              {p.badge}
            </span>
          )}
          <button
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background transition-smooth disabled:opacity-60"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                wishlisted ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
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
                    color: p.colors?.[0]?.name || "Standard",
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
      <Link href={`/product/${p.slug}`} className="block space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{p.name}</h3>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {p.rating}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{p.subtitle}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-base font-bold">₹{p.price.toLocaleString("en-IN")}</p>
          {p.oldPrice && (
            <p className="text-xs text-muted-foreground line-through">
              ₹{p.oldPrice.toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
};
