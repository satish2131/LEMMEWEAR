"use client";
import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import Link from 'next/link';
import { searchProducts } from "@/lib/api";

const SUGGESTIONS = [
  { label: "Customize T-Shirt", to: "/customize" },
  { label: "Men's Collection", to: "/shop/men" },
  { label: "Women's Collection", to: "/shop/women" },
  { label: "Unisex", to: "/shop/unisex" },
  { label: "Gift Packs", to: "/gift-packs" },
  { label: "Accessories", to: "/accessories" },
  { label: "Track my Order", to: "/track" },
];

interface SearchResult {
  slug: string;
  name: string;
  category: string;
  price: number;
}

export const SearchOverlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchProducts(query, 8);
      setResults((res.data || []) as SearchResult[]);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => doSearch(q), 300);
    return () => clearTimeout(timeout);
  }, [q, doSearch]);

  if (!open) return null;

  const filtered = q
    ? SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()))
    : SUGGESTIONS;

  return (
    <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div className="container pt-24" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-2xl bg-card shadow-elegant border border-border overflow-hidden max-w-2xl mx-auto">
          <form 
            className="flex items-center gap-3 px-5 py-4 border-b border-border"
            onSubmit={(e) => {
              e.preventDefault();
              doSearch(q);
            }}
          >
            <button type="submit" aria-label="Search" className="outline-none">
              <SearchIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-smooth" />
            </button>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, designs, gift packs..."
              className="flex-1 bg-transparent outline-none text-base"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-smooth">
              <X className="h-5 w-5" />
            </button>
          </form>
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            {/* Product results from database */}
            {q.trim().length >= 2 && results.length > 0 && (
              <>
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Products
                </p>
                {results.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-smooth"
                  >
                    <div className="flex items-center gap-3">
                      <SearchIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{product.name}</span>
                        <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">₹{product.price?.toLocaleString("en-IN")}</span>
                  </Link>
                ))}
              </>
            )}

            {/* Quick links / suggestions */}
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {q ? "Quick Links" : "Popular"}
            </p>
            {filtered.length === 0 && results.length === 0 && (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">No results for &quot;{q}&quot;</p>
            )}
            {filtered.map((s) => (
              <Link key={s.to} href={s.to} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-smooth">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
