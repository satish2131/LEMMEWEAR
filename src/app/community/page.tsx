"use client";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Upload, Star, Users, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const mockDesigns = [
  { id: 1, title: "Cosmic Drift", designer: "Arjun V.", likes: 412, hue: 260, sales: 89 },
  { id: 2, title: "Sakura Wave", designer: "Priya S.", likes: 387, hue: 340, sales: 64 },
  { id: 3, title: "Geometry Gods", designer: "Rohan M.", likes: 305, hue: 195, sales: 51 },
  { id: 4, title: "Urban Jungle", designer: "Kavya T.", likes: 278, hue: 120, sales: 43 },
  { id: 5, title: "Neon Requiem", designer: "Adit K.", likes: 251, hue: 290, sales: 39 },
  { id: 6, title: "Marble & Gold", designer: "Sneha R.", likes: 198, hue: 45, sales: 31 },
];

import { AuthGuard } from "@/components/auth/AuthGuard";

const Community = () => {
  const [tab, setTab] = useState<"trending" | "new" | "top">("trending");

  useEffect(() => { document.title = "Community Designs — LumeWear"; }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 gradient-hero opacity-40" aria-hidden />
          <div className="container relative py-16 lg:py-24">
            <p className="text-sm font-medium text-primary mb-3">Community</p>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">Design. <span className="gradient-text">Earn. Repeat.</span></h1>
            <p className="text-muted-foreground max-w-xl mb-8">Upload your designs and earn commission every time one sells. Join thousands of artists shaping the LumeWear identity.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" className="gap-2" onClick={() => toast("Upload portal coming soon ✨")}>
                <Upload className="h-4 w-4" /> Upload Your Design
              </Button>
              <Button variant="outline" size="lg">How It Works</Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border/40">
          <div className="container py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "12,400+", label: "Community Designers" },
              { icon: Upload, value: "3.2M+", label: "Designs Uploaded" },
              { icon: TrendingUp, value: "₹4.8Cr+", label: "Paid to Designers" },
              { icon: Award, value: "15%", label: "Commission Per Sale" },
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

        {/* Designs Grid */}
        <section className="container py-12">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold">Community Designs</h2>
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              {(["trending", "new", "top"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-smooth ${tab === t ? "bg-background shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {mockDesigns.map((d) => (
              <article key={d.id} className="group">
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 shadow-soft transition-smooth group-hover:shadow-card cursor-pointer relative"
                  style={{ background: `radial-gradient(circle at 50% 30%, hsl(${d.hue} 70% 75%), hsl(${d.hue} 60% 50%))` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/80 font-bold text-sm font-mono text-center px-2">{d.title.toUpperCase()}</span>
                  </div>
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                    <Button size="sm" variant="hero" className="text-xs" onClick={() => toast(`Viewing "${d.title}" design`)}>View & Buy</Button>
                  </div>
                </div>
                <p className="font-semibold text-xs">{d.title}</p>
                <p className="text-xs text-muted-foreground">by {d.designer}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Star className="h-3 w-3 fill-primary text-primary" />{d.likes}</span>
                  <span className="text-xs text-primary font-medium">{d.sales} sold</span>
                </div>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-3xl gradient-primary p-10 lg:p-16 text-primary-foreground text-center shadow-elegant relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 bg-primary-glow/30 rounded-full blur-3xl" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Become a LumeWear Designer</h2>
            <p className="opacity-85 mb-8 max-w-md mx-auto">Upload your artwork. When someone buys a tee with your design, you earn 15% commission — automatically.</p>
            <Button size="xl" className="bg-background text-primary hover:bg-background/90 shadow-lg gap-2" onClick={() => toast("Designer signup coming soon ✨")}>
              <Upload className="h-5 w-5" /> Start Creating
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default function ProtectedCommunity() {
  return (
    <AuthGuard>
      <Community />
    </AuthGuard>
  );
}
