"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload, Star, Users, TrendingUp, Award, Heart,
  Search, Loader2, Palette, Share2, ShoppingBag,
  Globe, Lock, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { readActiveCart, writeActiveCart } from "@/lib/cartKey";

interface CommunityDesign {
  _id: string;
  userEmail: string;
  userName: string;
  name: string;
  preview: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
}

interface MyDesign {
  _id: string;
  name: string;
  preview: string;
  isPublic: boolean;
  likes: number;
  createdAt: string;
}

// ─── Design card ──────────────────────────────────────────────────────────────
function DesignCard({
  design,
  userEmail,
  onLike,
  onBuy,
}: {
  design: CommunityDesign;
  userEmail?: string;
  onLike: (id: string) => void;
  onBuy: (design: CommunityDesign) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(design.likes);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userEmail) { toast.error("Please sign in to like designs"); return; }
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: design._id, userEmail }),
      });
      const json = await res.json();
      if (json.success) {
        setLiked(json.data.liked);
        setLikeCount(json.data.likes);
        onLike(design._id);
      }
    } catch { toast.error("Failed to like design"); }
    finally { setLiking(false); }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community?design=${design._id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!")).catch(() => toast("Share: " + url));
  };

  return (
    <article className="group relative">
      <div className="aspect-square rounded-2xl overflow-hidden mb-3 shadow-soft transition-smooth group-hover:shadow-card bg-muted relative">
        {design.preview ? (
          <img
            src={design.preview}
            alt={design.name}
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center gradient-primary">
            <Palette className="h-10 w-10 text-white/60" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-smooth flex flex-col items-center justify-center gap-2 p-3">
          <Button
            size="sm" variant="hero" className="w-full text-xs gap-1.5"
            onClick={(e) => { e.stopPropagation(); onBuy(design); }}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Buy This Design
          </Button>
          <div className="flex gap-2 w-full">
            <button
              onClick={handleLike}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                liked ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-white" : ""}`} />
              {likeCount}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </div>
      </div>

      <p className="font-semibold text-xs truncate">{design.name}</p>
      <p className="text-xs text-muted-foreground">by {design.userName}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <Heart className={`h-3 w-3 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{likeCount}</span>
      </div>
    </article>
  );
}

// ─── My design card (with publish toggle) ─────────────────────────────────────
function MyDesignCard({
  design,
  onTogglePublic,
}: {
  design: MyDesign;
  onTogglePublic: (id: string, isPublic: boolean) => void;
}) {
  const [toggling, setToggling] = useState(false);

  const toggle = async () => {
    setToggling(true);
    onTogglePublic(design._id, !design.isPublic);
    setToggling(false);
  };

  return (
    <article className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-soft hover:shadow-card transition-smooth">
      <div className="aspect-square bg-muted relative">
        {design.preview ? (
          <img src={design.preview} alt={design.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center gradient-primary">
            <Palette className="h-8 w-8 text-white/60" />
          </div>
        )}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          design.isPublic ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
        }`}>
          {design.isPublic ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
          {design.isPublic ? "Public" : "Private"}
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate mb-1">{design.name}</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3 w-3" /> {design.likes}
          </span>
          <button
            onClick={toggle}
            disabled={toggling}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
              design.isPublic
                ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : design.isPublic ? "Make Private" : "Share to Community"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tab, setTab]           = useState<"trending" | "new" | "top">("trending");
  const [view, setView]         = useState<"community" | "my">("community");
  const [designs, setDesigns]   = useState<CommunityDesign[]>([]);
  const [myDesigns, setMyDesigns] = useState<MyDesign[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { document.title = "Community Designs — LemmeWear"; }, []);

  // Load community designs
  const loadDesigns = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort: tab, page: String(p), limit: "12" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/community?${params}`);
      const json = await res.json();
      if (json.success) {
        setDesigns((prev) => append ? [...prev, ...json.data] : json.data);
        setTotalPages(json.pagination.totalPages);
        setPage(p);
      }
    } catch { toast.error("Failed to load designs"); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [tab, search]);

  useEffect(() => { loadDesigns(1); }, [loadDesigns]);

  // Load my designs
  const loadMyDesigns = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/users/designs?email=${encodeURIComponent(user.email)}`);
      const json = await res.json();
      if (json.success) setMyDesigns(json.data);
    } catch { /* silent */ }
  }, [user?.email]);

  useEffect(() => {
    if (view === "my") loadMyDesigns();
  }, [view, loadMyDesigns]);

  const handleTogglePublic = async (designId: string, isPublic: boolean) => {
    if (!user?.email) return;
    try {
      const res = await fetch("/api/users/designs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, userEmail: user.email, isPublic }),
      });
      const json = await res.json();
      if (json.success) {
        setMyDesigns((prev) => prev.map((d) => d._id === designId ? { ...d, isPublic } : d));
        toast.success(isPublic ? "Design shared to community!" : "Design made private");
        if (isPublic) loadDesigns(1);
      }
    } catch { toast.error("Failed to update design"); }
  };

  const handleBuy = (design: CommunityDesign) => {
    const item = {
      id: Date.now() + Math.random(),
      name: `${design.name} (Community Design)`,
      slug: `community-${design._id}`,
      color: "Custom",
      size: "M",
      price: 1499,
      qty: 1,
      image: design.preview || "/assets/hero-tshirt.jpg",
    };
    const cart = readActiveCart();
    cart.push(item);
    writeActiveCart(cart);
    toast.success(`${design.name} added to cart!`);
    router.push("/cart");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 gradient-hero opacity-40" aria-hidden />
          <div className="container relative py-16 lg:py-20">
            <p className="text-sm font-medium text-primary mb-3">Community</p>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Design. <span className="gradient-text">Earn. Repeat.</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mb-8">
              Share your designs with the community. When someone buys a tee with your design, you earn 15% commission — automatically.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" className="gap-2"
                onClick={() => {
                  if (!user) { toast.error("Please sign in first"); router.push("/login"); return; }
                  router.push("/customize");
                }}>
                <Palette className="h-4 w-4" /> Create a Design
              </Button>
              {user && (
                <Button variant="outline" size="lg" onClick={() => setView("my")}>
                  My Designs
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-b border-border/40">
          <div className="container py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users,      value: "12,400+", label: "Community Designers" },
              { icon: Upload,     value: "3.2M+",   label: "Designs Uploaded" },
              { icon: TrendingUp, value: "₹4.8Cr+", label: "Paid to Designers" },
              { icon: Award,      value: "15%",     label: "Commission Per Sale" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="h-10 w-10 rounded-xl gradient-primary grid place-items-center mx-auto mb-3 shadow-glow">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="text-2xl font-bold gradient-text">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Designs section ── */}
        <section className="container py-12">

          {/* View toggle */}
          {user && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setView("community")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-smooth ${
                  view === "community" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Community
              </button>
              <button
                onClick={() => setView("my")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-smooth ${
                  view === "my" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                My Designs
              </button>
            </div>
          )}

          {view === "community" ? (
            <>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-bold">Community Designs</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search designs..."
                      className="pl-9 h-9"
                    />
                  </div>
                  {/* Sort tabs */}
                  <div className="flex gap-1 bg-secondary rounded-lg p-1 shrink-0">
                    {(["trending", "new", "top"] as const).map((t) => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-smooth ${
                          tab === t ? "bg-background shadow-soft" : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : designs.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No designs yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {search ? "No designs match your search." : "Be the first to share a design with the community!"}
                  </p>
                  <Button variant="hero" onClick={() => router.push("/customize")} className="gap-2">
                    <Palette className="h-4 w-4" /> Create First Design
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {designs.map((d) => (
                      <DesignCard
                        key={d._id}
                        design={d}
                        userEmail={user?.email}
                        onLike={() => {}}
                        onBuy={handleBuy}
                      />
                    ))}
                  </div>

                  {/* Load more */}
                  {page < totalPages && (
                    <div className="text-center mt-10">
                      <Button variant="outline" onClick={() => loadDesigns(page + 1, true)} disabled={loadingMore} className="gap-2">
                        {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Load more designs
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* ── My Designs ── */
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">My Designs</h2>
                <Button variant="hero" size="sm" className="gap-1.5" onClick={() => router.push("/customize")}>
                  <Palette className="h-4 w-4" /> Create New
                </Button>
              </div>

              {myDesigns.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No saved designs</h3>
                  <p className="text-muted-foreground mb-6">Create a design in the customizer and save it to share with the community.</p>
                  <Button variant="hero" onClick={() => router.push("/customize")} className="gap-2">
                    <Palette className="h-4 w-4" /> Go to Customizer
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {myDesigns.map((d) => (
                    <MyDesignCard key={d._id} design={d} onTogglePublic={handleTogglePublic} />
                  ))}
                </div>
              )}

              {/* How it works */}
              <div className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-bold text-lg mb-4">How Community Sharing Works</h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { icon: Palette,      step: "1", title: "Create",  desc: "Design your tee in the 3D customizer" },
                    { icon: Globe,        step: "2", title: "Share",   desc: "Toggle 'Share to Community' on any saved design" },
                    { icon: CheckCircle2, step: "3", title: "Earn",    desc: "Get 15% commission every time someone buys your design" },
                  ].map(({ icon: Icon, step, title, desc }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl gradient-primary grid place-items-center shrink-0 shadow-glow">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{step}. {title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CTA banner ── */}
          <div className="mt-16 rounded-3xl gradient-primary p-10 lg:p-16 text-primary-foreground text-center shadow-elegant relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 bg-primary-glow/30 rounded-full blur-3xl" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Become a LemmeWear Designer</h2>
            <p className="opacity-85 mb-8 max-w-md mx-auto">
              Upload your artwork. When someone buys a tee with your design, you earn 15% commission — automatically.
            </p>
            <Button
              size="lg"
              className="bg-background text-primary hover:bg-background/90 shadow-lg gap-2"
              onClick={() => {
                if (!user) { router.push("/login"); return; }
                router.push("/customize");
              }}
            >
              <Upload className="h-5 w-5" /> Start Creating
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
