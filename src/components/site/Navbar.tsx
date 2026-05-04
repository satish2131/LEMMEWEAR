"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { SearchOverlay } from "./SearchOverlay";
import { useAuth } from "@/context/AuthContext";

const shopMegaMenu = {
  categories: [
    { href: "/shop/unisex", label: "Unisex" },
    { href: "/accessories", label: "Accessories" },
    { href: "/shop/men", label: "Men" },
    { href: "/shop/women", label: "Women" },
  ],
  fitAndStyle: [
    { href: "/shop/unisex", label: "Oversized T-Shirts" },
    { href: "/shop/unisex", label: "Regular Fit T-Shirts" },
    { href: "/shop/unisex", label: "Relaxed Fit T-Shirts" },
    { href: "/shop/unisex", label: "Longline T-Shirts" },
    { href: "/shop/unisex", label: "Half Sleeve T-Shirts" },
    { href: "/shop/unisex", label: "Full Sleeve T-Shirts" },
    { href: "/shop/unisex", label: "Sleeveless T-Shirts" },
    { href: "/shop/unisex", label: "Tank Tops" },
  ],
  themes: [
    { href: "/shop/unisex", label: "Plain / Solid" },
    { href: "/shop/unisex", label: "Graphic Print" },
    { href: "/shop/unisex", label: "Typography (Quotes)" },
    { href: "/shop/unisex", label: "Minimalist" },
    { href: "/shop/unisex", label: "Anime" },
    { href: "/shop/unisex", label: "Streetwear Designs" },
    { href: "/shop/unisex", label: "Vintage / Washed" },
    { href: "/shop/unisex", label: "Aesthetic / Soft-tone" },
    { href: "/shop/unisex", label: "Abstract Design" },
    { href: "/shop/unisex", label: "Cartoon / Pop Culture" },
    { href: "/shop/unisex", label: "Logo-Based" },
    { href: "/shop/unisex", label: "Meme T-Shirts" },
  ],
};

const leftLinks  = [
  { href: "/shop/men", label: "Shop", megaMenu: shopMegaMenu },
  { href: "/customize", label: "Customize" },
  { href: "/gift-packs", label: "Gift Packs" },
];
const rightLinks = [
  { href: "/community", label: "Community" },
  { href: "/track", label: "Track" },
  { href: "/about", label: "About" },
];
const mobileLinks = [
  { href: "/", label: "Home" },
  { href: "/shop/unisex", label: "Unisex" },
  { href: "/accessories", label: "Accessories" },
  { href: "/shop/men", label: "Men" },
  { href: "/shop/women", label: "Women" },
  { href: "/customize", label: "Customize" },
  { href: "/gift-packs", label: "Gift Packs" },
  { href: "/community", label: "Community" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("lemmewear_cart") || "[]");
        setCartCount(cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0));
      } catch (e) {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cart_updated", updateCartCount);
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cart_updated", updateCartCount);
    };
  }, []);

  const openShop  = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setShopOpen(true); };
  const closeShop = () => { closeTimer.current = setTimeout(() => setShopOpen(false), 150); };

  const textCls = transparent ? "text-white/90 hover:text-white" : "text-foreground/75 hover:text-primary";
  const iconCls = transparent ? "text-white hover:text-white/80" : "";

  const renderNav = (links: typeof leftLinks) => (
    <nav className="hidden lg:flex items-center gap-6">
      {links.map((l) =>
        l.megaMenu ? (
          <div key={l.href} className="relative" onMouseEnter={openShop} onMouseLeave={closeShop}>
            <button className={`flex items-center gap-1 text-sm font-medium transition-smooth ${textCls}`}>
              {l.label}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${shopOpen ? "rotate-180" : ""}`} />
            </button>
            {shopOpen && (
              <div className="absolute top-full -left-10" onMouseEnter={openShop} onMouseLeave={closeShop}>
                <div className="h-4 w-full" />
                <div className="rounded-xl border border-border bg-background/95 backdrop-blur shadow-elegant p-8 w-[750px] flex gap-12">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-4 tracking-wider text-muted-foreground uppercase">Categories</h3>
                    <ul className="space-y-3">
                      {l.megaMenu.categories.map((d) => (
                        <li key={d.label}>
                          <Link href={d.href} className="text-sm font-medium hover:text-primary transition-colors text-foreground" onClick={() => setShopOpen(false)}>{d.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 border-l border-border/50 pl-8">
                    <h3 className="font-bold text-sm mb-4 tracking-wider text-muted-foreground uppercase">Fit &amp; Style</h3>
                    <ul className="space-y-3">
                      {l.megaMenu.fitAndStyle.map((d) => (
                        <li key={d.label}>
                          <Link href={d.href} className="text-sm text-foreground/80 hover:text-primary transition-colors" onClick={() => setShopOpen(false)}>{d.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-[1.2] border-l border-border/50 pl-8">
                    <h3 className="font-bold text-sm mb-4 tracking-wider text-muted-foreground uppercase">Themes</h3>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {l.megaMenu.themes.map((d) => (
                        <li key={d.label}>
                          <Link href={d.href} className="text-sm text-foreground/80 hover:text-primary transition-colors" onClick={() => setShopOpen(false)}>{d.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium transition-smooth ${
              transparent
                ? pathname === l.href ? "text-white font-semibold" : "text-white/80 hover:text-white"
                : pathname === l.href ? "text-primary" : "text-foreground/75 hover:text-primary"
            }`}
          >
            {l.label}
          </Link>
        )
      )}
    </nav>
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
          transparent
            ? "bg-transparent border-transparent"
            : "bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-sm"
        }`}
      >
        <div className="container relative flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost" size="icon" className={`lg:hidden -ml-2 ${iconCls}`}
              onClick={() => setOpen(!open)} aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {renderNav(leftLinks)}
          </div>

          <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center shrink-0">
            <span
              className={`text-3xl md:text-5xl font-black tracking-widest uppercase transition-colors duration-300 ${transparent ? "text-white" : "text-foreground"}`}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              LEMMEWEAR
            </span>
          </Link>

          <div className="flex items-center gap-2 lg:gap-6">
            {renderNav(rightLinks)}
            <div className="flex items-center gap-0.5 md:gap-1">
              <Button variant="ghost" size="icon" aria-label="Search" className={iconCls} onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Cart" className={`relative ${iconCls}`} onClick={() => router.push("/cart")}>
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={user ? "Account" : "Sign In"}
                className={`hidden sm:inline-flex ${iconCls}`}
                onClick={() => router.push(user ? "/account" : "/login")}
              >
                {user ? (
                  <span className="h-7 w-7 rounded-full gradient-primary text-[11px] font-bold text-primary-foreground flex items-center justify-center uppercase">
                    {user.name.charAt(0)}
                  </span>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur">
            <nav className="container flex flex-col py-3">
              {mobileLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="py-2.5 text-sm font-medium border-b border-border/30 last:border-0 hover:text-primary transition-smooth"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
