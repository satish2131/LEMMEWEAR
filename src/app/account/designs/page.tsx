"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ChevronLeft, Palette, Trash2, Loader2, Plus, Shirt
} from "lucide-react";
import { fetchSavedDesigns, deleteSavedDesign } from "@/lib/api";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";

interface SavedDesign {
  _id: string;
  name: string;
  preview: string;
  config: {
    shirtColor?: string;
    shirtStyle?: string;
    frontText?: string;
    backText?: string;
    frontImage?: string;
    backImage?: string;
  };
  createdAt: string;
}

const USER_EMAIL = "guest@lemmewear.com";

function SavedDesignsContent() {
  const { user } = useAuth();
  const userEmail = user?.email || "";
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Saved Designs — LemmeWear";
    if (!userEmail) return;
    fetchSavedDesigns(userEmail)
      .then((res) => setDesigns((res.data || []) as SavedDesign[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userEmail]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteSavedDesign(id);
      setDesigns((prev) => prev.filter((d) => d._id !== id));
      toast.success("Design deleted");
    } catch {
      toast.error("Failed to delete design");
    } finally {
      setDeleting(null);
    }
  };

  // Color name lookup for display
  const getColorName = (hex?: string) => {
    const colors: Record<string, string> = {
      "#ffffff": "White", "#000000": "Black", "#0f1115": "Onyx",
      "#5b1f5e": "Deep Plum", "#6d28d9": "Royal Purple",
      "#f4f4f4": "Soft White", "#a3b18a": "Sage", "#f9a8c4": "Blush",
      "#c4b5fd": "Lavender",
    };
    return hex ? (colors[hex.toLowerCase()] || hex) : "White";
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-primary grid place-items-center shadow-glow">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold">Saved Designs</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {loading ? "Loading..." : `${designs.length} design${designs.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <Button asChild variant="hero" size="sm" className="gap-1.5">
                <Link href="/customize">
                  <Plus className="h-4 w-4" /> New Design
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container py-10 max-w-5xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : designs.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-16 text-center shadow-soft">
              <div className="h-20 w-20 rounded-full bg-secondary mx-auto grid place-items-center mb-5">
                <Palette className="h-9 w-9 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No saved designs</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create a custom t-shirt design in our 3D customizer and save it here for later.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link href="/customize">Open Customizer</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {designs.map((design) => (
                <div
                  key={design._id}
                  className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-smooth hover:shadow-card hover:-translate-y-0.5"
                >
                  {/* Preview */}
                  <div className="relative aspect-square bg-muted grid place-items-center overflow-hidden">
                    {design.preview ? (
                      <img
                        src={design.preview}
                        alt={design.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full flex flex-col items-center justify-center gap-3"
                        style={{ backgroundColor: design.config.shirtColor || "#f4f4f4" }}
                      >
                        <Shirt className="h-16 w-16 text-foreground/20" />
                        {design.config.frontText && (
                          <p className="text-sm font-semibold text-foreground/40 px-4 text-center truncate max-w-full">
                            &ldquo;{design.config.frontText}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                    {/* Shirt color swatch */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur text-[10px] font-semibold">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border"
                        style={{ background: design.config.shirtColor || "#f4f4f4" }}
                      />
                      {getColorName(design.config.shirtColor)}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold font-sans">{design.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {design.config.shirtStyle || "Crew Neck"} ·{" "}
                        {new Date(design.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>

                    {/* Config summary */}
                    <div className="flex flex-wrap gap-1.5">
                      {design.config.frontText && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          Front Text
                        </span>
                      )}
                      {design.config.backText && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          Back Text
                        </span>
                      )}
                      {design.config.frontImage && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          Front Image
                        </span>
                      )}
                      {design.config.backImage && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          Back Image
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button asChild variant="hero" size="sm" className="flex-1 gap-1.5">
                        <Link href="/customize">
                          <Sparkles className="h-3.5 w-3.5" /> Edit Design
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                        onClick={() => handleDelete(design._id)}
                        disabled={deleting === design._id}
                      >
                        {deleting === design._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function SavedDesignsPage() {
  return (
    <AuthGuard>
      <SavedDesignsContent />
    </AuthGuard>
  );
}
