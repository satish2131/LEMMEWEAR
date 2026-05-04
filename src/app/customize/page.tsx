"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles, ShoppingBag, RotateCw, Gift,
  Image as ImageIcon, Type, Palette, Move3d, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { BookmarkPlus } from "lucide-react";

/* Dynamic import — disables SSR for the heavy Three.js Canvas */
const ShirtViewer = dynamic(() => import("@/components/site/ShirtViewer"), { ssr: false });

/* ─── Constants ─── */
const PALETTE = [
  { name: "White",  hex: "#f5f5f5" },
  { name: "Royal",  hex: "#7c3aed" },
  { name: "Plum",   hex: "#5b21b6" },
  { name: "Onyx",   hex: "#1a1a1a" },
  { name: "Navy",   hex: "#1e3a5f" },
  { name: "Rose",   hex: "#f43f5e" },
  { name: "Sage",   hex: "#4ade80" },
  { name: "Sky",    hex: "#38bdf8" },
];

const FONTS = [
  { name: "Sans",  value: "Inter, Arial, sans-serif" },
  { name: "Serif", value: "Playfair Display, Georgia, serif" },
  { name: "Mono",  value: "Courier New, monospace" },
];

/* ─── Draw design content into a canvas context ─── */
function drawDesign(ctx: CanvasRenderingContext2D, size: number, opts: {
  text: string; font: string; textColor: string;
  scale: number; posY: number; uploadedImg: HTMLImageElement | null;
}) {
  const { text, font, textColor, scale, posY, uploadedImg } = opts;

  if (uploadedImg) {
    const imgSize = Math.round(size * 0.60 * scale);
    ctx.drawImage(uploadedImg, size / 2 - imgSize / 2, size / 2 + posY * 200 - imgSize / 2, imgSize, imgSize);
  }

  if (text.trim()) {
    const px = Math.round(80 * scale);
    const safeFont = font.includes("Playfair")
      ? `"Playfair Display", Georgia, serif`
      : font.includes("Courier")
        ? `"Courier New", Courier, monospace`
        : `"Inter", Arial, sans-serif`;
    ctx.save();
    ctx.font = `700 ${px}px ${safeFont}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = px * 0.1;
    ctx.fillStyle = textColor;
    const lines = text.split("\n");
    const lh = px * 1.22;
    const baseY = uploadedImg
      ? size / 2 + posY * 200 + Math.round(size * 0.30 * scale)
      : size / 2 + posY * 200;
    const startY = baseY - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l, size / 2, startY + i * lh));
    ctx.restore();
  }
}

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = true;   // standard WebGL orientation — text upright on plane meshes
  t.needsUpdate = true;
  return t;
}

/* ─── Build front + back design textures ─── */
export function buildDesignTextures(opts: {
  text: string; font: string; textColor: string;
  scale: number; posY: number; uploadedImg: HTMLImageElement | null;
}): { front: THREE.CanvasTexture; back: THREE.CanvasTexture } {
  const size = 1024;

  // FRONT: draw normally
  const frontCanvas = document.createElement("canvas");
  frontCanvas.width = size; frontCanvas.height = size;
  const fCtx = frontCanvas.getContext("2d")!;
  fCtx.clearRect(0, 0, size, size);
  drawDesign(fCtx, size, opts);

  // BACK: draw with horizontal mirror so it reads correctly from behind
  const backCanvas = document.createElement("canvas");
  backCanvas.width = size; backCanvas.height = size;
  const bCtx = backCanvas.getContext("2d")!;
  bCtx.clearRect(0, 0, size, size);
  bCtx.save();
  bCtx.translate(size, 0);
  bCtx.scale(-1, 1);
  drawDesign(bCtx, size, opts);
  bCtx.restore();

  return { front: makeTexture(frontCanvas), back: makeTexture(backCanvas) };
}

/* ─── Page ─── */
export default function Customize() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [text, setText] = useState("YOUR\nIDENTITY");
  const [font, setFont] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState("#ffffff");
  const [shirtColor, setShirtColor] = useState(PALETTE[1].hex);
  const [scale, setScale] = useState(1);
  const [posY, setPosY] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [uploadedImg, setUploadedImg] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [designTexFront, setDesignTexFront] = useState<THREE.CanvasTexture | null>(null);
  const [designTexBack, setDesignTexBack] = useState<THREE.CanvasTexture | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { front, back } = buildDesignTextures({ text, font, textColor, scale, posY, uploadedImg });
    setDesignTexFront(old => { old?.dispose(); return front; });
    setDesignTexBack(old => { old?.dispose(); return back; });
  }, [text, font, textColor, scale, posY, uploadedImg]);

  const handleSaveDesign = async () => {
    if (!user?.email) {
      toast.error("Please login to save your design");
      router.push("/login");
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch("/api/users/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          name: text.trim() || "My Custom Design",
          preview: preview || "/assets/hero-tshirt.jpg",
          config: { text, font, textColor, shirtColor, scale, posY }
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Design saved to your dashboard!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save design");
    } finally {
      setIsSaving(false);
    }
  };

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setPreview(src);
      const img = new window.Image();
      img.onload = () => setUploadedImg(img);
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) loadImage(f);
  };
  const removeImage = () => {
    setUploadedImg(null); setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16" />
      <main className="flex-1">
        <div className="container py-10">

          {/* Hero Banner */}
          <div className="relative rounded-[1.5rem] overflow-hidden gradient-primary p-6 lg:p-10 text-primary-foreground shadow-elegant mb-8">
            <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-primary-glow/40 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-background/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-xs font-medium mb-2 opacity-80 uppercase tracking-widest">Design Studio</p>
                <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  Customize your tee
                </h1>
                <p className="opacity-85 max-w-sm text-sm">
                  Real 3D UV-mapped shirt model. Drag to rotate. Upload your art or add text.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: ImageIcon, title: "Upload Image", desc: "Use your own art or photo" },
                  { icon: Type,      title: "Add Text",     desc: "Express your story in words" },
                  { icon: Palette,   title: "Pick Colors",  desc: "Endless palette options" },
                  { icon: Move3d,    title: "3D Preview",   desc: "Drag to rotate live" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl bg-background/10 backdrop-blur border border-background/20 p-4 hover:bg-background/20 transition-smooth">
                    <div className="h-8 w-8 grid place-items-center rounded-lg bg-background/20 mb-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{title}</h3>
                    <p className="text-xs opacity-75">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6">

            {/* 3D Viewport */}
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-card lg:h-[680px] aspect-square lg:aspect-auto"
              style={{
                background: "radial-gradient(ellipse at 55% 35%, #e8e1fa 0%, #f0ecfc 45%, #e4dff5 100%)",
                contain: "strict",   /* CSS containment prevents 3D canvas overflow */
              }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(70% 60% at 50% 40%, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />

              <ShirtViewer
                shirtColor={shirtColor}
                designTexFront={designTexFront}
                designTexBack={designTexBack}
                autoRotate={autoRotate}
                onInteract={() => setAutoRotate(false)}
              />

              <button onClick={() => setAutoRotate(v => !v)}
                className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-white/80 backdrop-blur shadow-soft hover:bg-white transition-smooth z-10"
                aria-label="Toggle rotation">
                <RotateCw className={`h-4 w-4 ${autoRotate ? "text-primary" : "text-muted-foreground"}`} />
              </button>
              <div className="absolute bottom-4 left-4 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-soft text-foreground/70 z-10">
                Drag to rotate · Scroll to zoom
              </div>
            </div>

            {/* Controls */}
            <aside className="rounded-3xl border border-border bg-card shadow-soft p-6 space-y-6 h-fit">

              {/* Upload */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Upload Design</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" id="design-upload" onChange={handleUpload} />
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Design" className="w-full h-28 object-contain rounded-xl border border-border bg-secondary/20" />
                    <button onClick={removeImage}
                      className="absolute top-1.5 right-1.5 h-6 w-6 grid place-items-center rounded-full bg-background/90 border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-smooth"
                      aria-label="Remove">
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-green-600 mt-1.5 text-center font-medium">✓ Applied to shirt</p>
                  </div>
                ) : (
                  <label htmlFor="design-upload"
                    className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-accent/30 cursor-pointer transition-smooth">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload image</span>
                  </label>
                )}
              </div>

              {/* Shirt Color */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shirt Color</Label>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {PALETTE.map((c) => (
                    <button key={c.hex} onClick={() => setShirtColor(c.hex)} title={c.name}
                      className={`h-10 rounded-xl border-2 transition-smooth ${shirtColor === c.hex ? "border-primary shadow-glow scale-110" : "border-border hover:scale-105"}`}
                      style={{ backgroundColor: c.hex }} aria-label={c.name} />
                  ))}
                </div>
              </div>

              {/* Text */}
              <div>
                <Label htmlFor="design-text" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Text</Label>
                <textarea id="design-text" value={text} onChange={(e) => setText(e.target.value)} rows={2}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Type your message..." />
              </div>

              {/* Font */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Font</Label>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {FONTS.map((f) => (
                    <button key={f.name} onClick={() => setFont(f.value)} style={{ fontFamily: f.value }}
                      className={`h-10 rounded-lg border text-sm font-semibold transition-smooth ${font === f.value ? "border-primary bg-accent text-primary" : "border-border hover:bg-secondary"}`}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text Color</Label>
                <div className="mt-3 flex items-center gap-3">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-14 rounded-lg cursor-pointer border border-border" />
                  <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Design Size</Label>
                  <span className="text-xs text-muted-foreground">{scale.toFixed(2)}x</span>
                </div>
                <Slider value={[scale]} onValueChange={(v) => setScale(v[0])} min={0.3} max={2} step={0.05} />
              </div>

              {/* Position */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position Y</Label>
                  <span className="text-xs text-muted-foreground">{posY.toFixed(2)}</span>
                </div>
                <Slider value={[posY]} onValueChange={(v) => setPosY(v[0])} min={-1} max={1} step={0.05} />
              </div>

              {/* CTA */}
              <div className="space-y-2 pt-2">
                <Button variant="hero" size="lg" className="w-full"
                  onClick={() => {
                    const newItem = {
                      id: Date.now(),
                      name: "Custom T-Shirt Design",
                      slug: "custom-tshirt-" + Date.now(),
                      color: PALETTE.find(p => p.hex === shirtColor)?.name || "Custom Color",
                      size: "M",
                      price: 1899,
                      qty: 1,
                      image: preview || "/assets/hero-tshirt.jpg"
                    };
                    try {
                      const existing = JSON.parse(localStorage.getItem('lemmewear_cart') || '[]');
                      const cartArray = Array.isArray(existing) ? existing : [];
                      cartArray.push(newItem);
                      localStorage.setItem('lemmewear_cart', JSON.stringify(cartArray));
                    } catch(e) {
                      console.error("Failed to add to cart", e);
                    }
                    toast.success("Added to cart!", { description: "Your custom design is saved." });
                    router.push("/cart");
                  }}>
                  <ShoppingBag className="h-4 w-4" /> Add to Cart · ₹1,899
                </Button>
                <Button variant="outline" size="lg" className="w-full border-primary/50 hover:bg-primary/5 text-primary hover:text-primary"
                  onClick={() => {
                    const customTee = {
                      id: "custom-" + Date.now(),
                      name: "Your Custom Design",
                      color: PALETTE.find(p => p.hex === shirtColor)?.name || "Custom Color",
                      price: 1899,
                      image: preview || "/assets/hero-tshirt.jpg"
                    };
                    localStorage.setItem("lemmewear_custom_gift_tshirt", JSON.stringify(customTee));
                    toast.success("Design saved!", { description: "Taking you to the Gift Pack builder..." });
                    router.push("/gift-packs");
                  }}>
                  <Gift className="h-4 w-4" /> Add to Gift Pack
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={handleSaveDesign} disabled={isSaving}>
                  {isSaving ? <RotateCw className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save to Dashboard"}
                </Button>
                <Button variant="ghost" size="lg" className="w-full text-muted-foreground"
                  onClick={() => toast("AI suggestions coming soon ✨")}>
                  <Sparkles className="h-4 w-4" /> AI Design Ideas
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
