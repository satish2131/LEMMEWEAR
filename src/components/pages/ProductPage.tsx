"use client";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Minus, Plus, Shield, Star, Truck, RotateCcw, ChevronRight, Ruler, Loader2 } from "lucide-react";
import { Product, getProductBySlug, getRelated } from "@/data/products";
import { toast } from "sonner";
import { fetchProductBySlug, addToWishlist } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ProductPage = ({ slug }: { slug: string }) => {
  const router = useRouter();
  const { user } = useAuth();
  const staticProduct = getProductBySlug(slug);
  const [product, setProduct] = useState(staticProduct);
  const [related, setRelated] = useState<Product[]>(staticProduct ? getRelated(staticProduct) : []);
  const [loading, setLoading] = useState(!staticProduct);

  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState(product?.colors[0]?.name ?? "");
  const [size, setSize] = useState<string | undefined>(product?.sizes?.[2] ?? product?.sizes?.[0]);
  const [qty, setQty] = useState(1);

  // Fetch from API (enhances with DB data)
  useEffect(() => {
    fetchProductBySlug(slug)
      .then((res) => {
        const apiRes = res as { data?: Product & { productId?: string }; related?: (Product & { productId?: string })[] };
        if (apiRes.data) {
          const p = { ...apiRes.data, id: apiRes.data.productId || apiRes.data.id };
          setProduct(p);
          setColor(p.colors[0]?.name ?? "");
          setSize(p.sizes?.[2] ?? p.sizes?.[0]);
          if (apiRes.related && apiRes.related.length > 0) {
            setRelated(apiRes.related.map((r) => ({ ...r, id: r.productId || r.id })));
          }
        }
      })
      .catch(() => { /* keep static data */ })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} — LemmeWear`;
    const desc = product.description.slice(0, 155);
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
    setActiveImg(0);
    setQty(1);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [product?.id]);

  if (loading) {
  
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="pt-16" />
        <main className="flex-1 container py-32 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
      <div className="pt-16" />        <main className="flex-1 container py-32 text-center">
          <h1 className="text-3xl font-bold mb-3">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>Back home</Button>
        </main>
        <Footer />
      </div>
    );
  }
  const categoryPath =
    product.category === "accessories" ? "/accessories" : `/shop/${product.category}`;

  const handleWishlist = async () => {
    if (!user?.email) {
      toast.error("Please login to add items to wishlist");
      router.push("/login");
      return;
    }
    try {
      await addToWishlist(user.email, product?.slug || slug);
      toast.success(`${product?.name} added to wishlist!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to add to wishlist");
    }
  };

  const handleAddToCart = () => {
    if (product.sizes && !size) {
      toast.error("Please select a size");
      return;
    }
    try {
      const cart = JSON.parse(localStorage.getItem('lemmewear_cart') || '[]');
      cart.push({
        id: Date.now() + Math.random(),
        name: product.name,
        slug: product.slug,
        color: color || product.colors?.[0]?.name || 'Standard',
        size: size || 'One Size',
        price: product.price,
        qty: qty,
        image: product.image || product.gallery?.[0]
      });
      localStorage.setItem('lemmewear_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart_updated'));
    } catch(e) {}
    toast.success(`${product.name} added to cart`, { description: `${color} • ${size ?? "One Size"} • Qty ${qty}` });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1">
        <div className="container py-6">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={categoryPath} className="hover:text-primary capitalize">{product.category}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>

        <section className="container pb-16 grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted shadow-card">
              <img
                src={product.gallery[activeImg]}
                alt={`${product.name} view ${activeImg + 1}`}
                width={800}
                height={1000}
                className="h-full w-full object-cover"
              />
            </div>
            {product.gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-smooth ${
                      i === activeImg ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    aria-label={`Show image ${i + 1}`}
                  >
                    <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:py-2">
            {product.badge && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide mb-3">
                {product.badge}
              </span>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground mb-4">{product.subtitle}</p>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} · {product.reviews} reviews
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-3xl font-bold">₹{product.price.toLocaleString("en-IN")}</span>
              {product.oldPrice && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    ₹{product.oldPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% off
                  </span>
                </>
              )}
            </div>

            {/* Color */}
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3">
                Color: <span className="text-muted-foreground font-normal">{color}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    aria-label={c.name}
                    className={`h-10 w-10 rounded-full border-2 transition-smooth ${
                      color === c.name ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            {product.sizes && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Size</p>
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
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`h-11 min-w-11 px-4 rounded-md border text-sm font-medium transition-smooth ${
                        size === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + CTAs */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-border rounded-md h-12">
                <button
                  className="px-3 h-full text-muted-foreground hover:text-foreground"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  className="px-3 h-full text-muted-foreground hover:text-foreground"
                  onClick={() => setQty(qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
                Add to cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                aria-label="Wishlist"
                onClick={handleWishlist}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="outlineHero"
              size="lg"
              className="w-full mb-8"
              onClick={() => {
                handleAddToCart();
                router.push('/cart');
              }}
            >
              Buy now
            </Button>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3 text-center mb-8">
              <div className="p-3 rounded-lg border border-border/60">
                <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-[11px] font-semibold">Free shipping</p>
                <p className="text-[10px] text-muted-foreground">Orders over ₹999</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <RotateCcw className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-[11px] font-semibold">Easy returns</p>
                <p className="text-[10px] text-muted-foreground">7-day window</p>
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-[11px] font-semibold">Secure checkout</p>
                <p className="text-[10px] text-muted-foreground">SSL encrypted</p>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-border pt-6">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{product.description}</p>
              <h3 className="font-semibold mb-2 text-sm">Highlights</h3>
              <ul className="space-y-1.5">
                {product.features.map((f) => (
                  <li key={f} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">•</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="container pb-20">
            <h2 className="text-2xl lg:text-3xl font-bold mb-8">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;
