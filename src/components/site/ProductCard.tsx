"use client";
import Link from 'next/link';
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/data/products";
import { toast } from "sonner";

interface Props {
  product: Product;
}

export const ProductCard = ({ product: p }: Props) => (
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
          aria-label="Add to wishlist"
          onClick={(e) => {
            e.preventDefault();
            toast.success(`${p.name} added to wishlist`);
          }}
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background transition-smooth"
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
                const cart = JSON.parse(localStorage.getItem('lemmewear_cart') || '[]');
                cart.push({
                  id: Date.now() + Math.random(),
                  name: p.name,
                  slug: p.slug,
                  color: p.colors?.[0]?.name || 'Standard',
                  size: 'M',
                  price: p.price,
                  qty: 1,
                  image: p.image
                });
                localStorage.setItem('lemmewear_cart', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart_updated'));
              } catch(e) {}
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
          <p className="text-xs text-muted-foreground line-through">₹{p.oldPrice.toLocaleString("en-IN")}</p>
        )}
      </div>
    </Link>
  </article>
);
