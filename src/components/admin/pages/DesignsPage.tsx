"use client";
import { useState, useEffect, useCallback } from "react";
import { Download, Eye, Palette, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SavedDesign {
  _id: string;
  userEmail: string;
  name: string;
  preview: string;
  config: {
    shirtColor: string;
    shirtStyle: string;
    frontText?: string;
    backText?: string;
  };
  createdAt: string;
}

export default function DesignsPage() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/designs?${params}`);
      const json = await res.json();
      if (json.success) setDesigns(json.data);
    } catch {
      toast.error("Failed to load designs");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchDesigns, 300);
    return () => clearTimeout(timer);
  }, [fetchDesigns]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Designs</h1>
          <p className="text-sm text-muted-foreground">User-created t-shirt designs gallery</p>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search designs..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Palette className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">No custom designs yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Designs will appear here once customers create them
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {designs.map((d, i) => (
            <Card
              key={d._id}
              className="rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-accent to-secondary overflow-hidden">
                {d.preview ? (
                  <img
                    src={d.preview}
                    alt={d.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-32 w-24 rounded-lg flex items-center justify-center text-4xl"
                    style={{ backgroundColor: d.config.shirtColor || "#ffffff" }}
                  >
                    👕
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 rounded-lg text-xs"
                    onClick={() => toast.info(`Viewing design: ${d.name}`)}
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                  {d.preview && (
                    <a href={d.preview} download={`${d.name}.png`}>
                      <Button size="sm" variant="secondary" className="gap-1.5 rounded-lg text-xs">
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm">{d.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">by {d.userEmail}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString("en-IN")}
                </p>
                {d.config.frontText && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Text: &quot;{d.config.frontText}&quot;
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
